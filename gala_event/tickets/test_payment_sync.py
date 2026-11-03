"""Tests for the reported bug (paid on Chargily, but no ticket / no email) and
for the dashboard email buttons. Chargily and the landing-site PDF are mocked."""
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.tests import make_participant
from notifications.models import EmailLog
from participants.models import Participant
from participants.tests import make_hr
from tickets.models import Ticket


def fake_chargily(checkouts):
    """Stand-in for tickets.chargily._get: /checkouts/<id> and the paged list."""
    def _get(path):
        if path.startswith('/checkouts/'):
            return next((c for c in checkouts if c['id'] == path.split('/')[2]), None)
        return {'data': checkouts, 'last_page': 1}
    return _get


def paid(participant, checkout_id='co_1', state='paid'):
    return {'id': checkout_id, 'status': state, 'metadata': {'participantId': str(participant.id)}}


@override_settings(CHARGILY_API_KEY='test_dummy')
@mock.patch('notifications.emails._ticket_pdf', return_value=b'%PDF-1.4 fake')
class PaymentSyncTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_hr())
        _, self.participant = make_participant('payer@example.com')

    def sync(self):
        return self.client.post(f'/api/participants/view/{self.participant.id}/sync_payment/')

    def test_paid_checkout_gives_a_ticket_and_an_email(self, _pdf):
        checkouts = [paid(self.participant)]
        with mock.patch('tickets.chargily._get', side_effect=fake_chargily(checkouts)):
            r = self.sync()
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['result'], 'ticket_issued')
        ticket = Ticket.objects.get(participant=self.participant)
        self.assertTrue(ticket.email_sent)
        self.participant.refresh_from_db()
        self.assertEqual(self.participant.payment_status, 'paid')
        message = mail.outbox[-1]
        self.assertEqual(message.to, ['payer@example.com'])
        self.assertIn(ticket.serial_number, message.body)
        names = [a[0] for a in message.attachments]
        self.assertIn(f'ticket-{ticket.serial_number}.pdf', names)
        self.assertIn(f'ticket-{ticket.serial_number}-qr.png', names)

        # Running it again changes nothing and sends nothing
        before = len(mail.outbox)
        with mock.patch('tickets.chargily._get', side_effect=fake_chargily(checkouts)):
            r = self.sync()
        self.assertEqual(r.json()['result'], 'up_to_date')
        self.assertEqual(len(mail.outbox), before)

    def test_unpaid_checkout_issues_nothing(self, _pdf):
        with mock.patch('tickets.chargily._get', side_effect=fake_chargily([paid(self.participant, state='pending')])):
            r = self.sync()
        self.assertEqual(r.json()['result'], 'not_paid')
        self.assertFalse(Ticket.objects.filter(participant=self.participant).exists())

    def test_marked_paid_without_ticket_is_repaired_without_chargily(self, _pdf):
        Participant.objects.filter(id=self.participant.id).update(payment_status='paid')
        with mock.patch('tickets.chargily._get', side_effect=AssertionError('Chargily should not be called')):
            r = self.sync()
        self.assertEqual(r.json()['result'], 'ticket_issued')
        self.assertTrue(Ticket.objects.get(participant=self.participant).email_sent)

    def test_ticket_that_was_never_emailed_is_sent(self, _pdf):
        Participant.objects.filter(id=self.participant.id).update(payment_status='paid')
        Ticket.objects.create(participant=self.participant, status='assigned', email_sent=False)
        self.assertEqual(self.sync().json()['result'], 'email_resent')

    def test_bulk_sync_goes_through_everyone_in_batches(self, _pdf):
        people = [make_participant(f'p{i}@example.com')[1] for i in range(7)]
        checkouts = [paid(p, checkout_id=f'co_{p.id}') for p in people]
        seen, after_id = [], None
        with mock.patch('tickets.chargily._get', side_effect=fake_chargily(checkouts)):
            for _ in range(10):
                r = self.client.post('/api/participants/view/sync_payments/', {'after_id': after_id}, format='json')
                self.assertEqual(r.status_code, 200)
                seen += r.json()['results']
                after_id = r.json()['next_after_id']
                if not after_id:
                    break
        issued = {o['id'] for o in seen if o['result'] == 'ticket_issued'}
        self.assertEqual(issued, {p.id for p in people})
        self.assertEqual(Ticket.objects.filter(email_sent=True).count(), 7)

    def test_missing_chargily_key_is_reported(self, _pdf):
        with override_settings(CHARGILY_API_KEY=''):
            r = self.sync()
        self.assertEqual(r.status_code, 502)
        self.assertIn('CHARGILY_API_KEY', r.json()['detail'])

    def test_paid_but_rejected_needs_review(self, _pdf):
        Participant.objects.filter(id=self.participant.id).update(status=Participant.Status.REJECTED)
        with mock.patch('tickets.chargily._get', side_effect=fake_chargily([paid(self.participant)])):
            r = self.sync()
        self.assertEqual(r.json()['result'], 'needs_review')
        self.assertFalse(Ticket.objects.filter(participant=self.participant).exists())


@mock.patch('notifications.emails._ticket_pdf', return_value=None)
class DashboardEmailButtonsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_hr())
        _, self.participant = make_participant('btn@example.com')

    def test_send_payment_link_button(self, _pdf):
        r = self.client.post(f'/api/participants/view/{self.participant.id}/send_payment_link/')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn(self.participant.public_token, r.json()['payment_url'])
        self.assertIn(self.participant.public_token, mail.outbox[-1].body)
        _, pending = make_participant('pend2@example.com', status=Participant.Status.PENDING, active=False)
        self.assertEqual(self.client.post(f'/api/participants/view/{pending.id}/send_payment_link/').status_code, 400)

    def test_manual_assign_emails_the_ticket(self, _pdf):
        free = Ticket.objects.create()
        r = self.client.post('/api/tickets/assign_ticket/',
                             {'participant_id': self.participant.id, 'ticket_serial': free.serial_number}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(r.json()['email_sent'])
        free.refresh_from_db()
        self.assertTrue(free.email_sent)
        self.assertEqual(mail.outbox[-1].to, ['btn@example.com'])
        # PDF not available -> QR image attached and a download link in the text
        self.assertIn('/api/tickets/download?token=', mail.outbox[-1].body)
        self.assertEqual(len(mail.outbox[-1].attachments), 1)

    def test_resend_and_smtp_failure_is_reported(self, _pdf):
        ticket = Ticket.objects.create(participant=self.participant, status='assigned')
        self.assertEqual(self.client.post(f'/api/tickets/{ticket.id}/resend_email/').status_code, 200)
        with mock.patch('django.core.mail.EmailMultiAlternatives.send', side_effect=OSError('SMTP down')):
            r = self.client.post(f'/api/tickets/{ticket.id}/resend_email/')
        self.assertEqual(r.status_code, 502)
        self.assertEqual(EmailLog.objects.filter(status='failed').count(), 1)


class ChargilyClientTests(TestCase):
    @override_settings(CHARGILY_API_KEY='test_dummy', CHARGILY_API_URL='')
    def test_sends_a_user_agent_and_uses_the_test_api(self):
        """Cloudflare in front of Chargily answers 403 to Python's default user agent."""
        from tickets import chargily

        seen = {}

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def read(self):
                return b'{"id": "co_9", "status": "pending"}'

        def fake_urlopen(request, timeout):
            seen['url'] = request.full_url
            seen['agent'] = request.get_header('User-agent')
            return FakeResponse()

        with mock.patch('urllib.request.urlopen', side_effect=fake_urlopen):
            self.assertEqual(chargily._get('/checkouts/co_9')['status'], 'pending')
        self.assertTrue(seen['url'].startswith('https://pay.chargily.net/test/api/v2/'))
        self.assertTrue(seen['agent'] and 'urllib' not in seen['agent'].lower())
