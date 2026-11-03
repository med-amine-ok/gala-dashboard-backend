import json
from unittest import mock

from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.tests import make_participant
from participants.models import Participant
from participants.tests import make_hr
from tickets.models import Ticket, TicketScan


class CheckInTests(TestCase):
    def setUp(self):
        self.hr = make_hr()
        self.client = APIClient()
        self.client.force_authenticate(self.hr)
        self.user, self.participant = make_participant(payment_status='paid')
        self.ticket = Ticket.objects.create(participant=self.participant, status='assigned')

    def checkin(self, serial, **extra):
        return self.client.post('/api/tickets/checkin/', dict(serial_number=serial, **extra), format='json')

    def test_checkin_route_is_reachable_and_single_use(self):
        r = self.checkin(self.ticket.serial_number)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.checkin(self.ticket.serial_number).status_code, 400)
        self.assertEqual(
            list(TicketScan.objects.values_list('scan_result', flat=True).order_by('id')),
            ['valid', 'already_checked_in'],
        )

    def test_checkin_accepts_the_qr_json(self):
        qr = json.dumps({'firstName': 'Pat', 'serialNumber': self.ticket.serial_number})
        self.assertEqual(self.checkin(qr).status_code, 200)

    def test_checkout(self):
        self.checkin(self.ticket.serial_number)
        self.assertEqual(self.checkin(self.ticket.serial_number, action='check_out').status_code, 200)

    def test_unassigned_and_cancelled_tickets_are_refused(self):
        free = Ticket.objects.create(participant=None)
        self.assertEqual(self.checkin(free.serial_number).status_code, 400)
        self.ticket.cancel_ticket()
        self.assertEqual(self.checkin(self.ticket.serial_number).status_code, 400)

    def test_only_hr_can_check_in_or_read_scans(self):
        client = APIClient()
        client.force_authenticate(self.user)
        self.assertEqual(client.post('/api/tickets/checkin/', {'serial_number': self.ticket.serial_number}).status_code, 403)
        self.assertEqual(client.get('/api/tickets/scan-history/').status_code, 403)
        self.assertEqual(self.client.get('/api/tickets/scan-history/').status_code, 200)

    def test_public_verify_has_no_personal_data(self):
        r = APIClient().get(f'/api/tickets/verify/{self.ticket.serial_number}/')
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('participant_name', r.json())
        free = Ticket.objects.create(participant=None)
        self.assertEqual(APIClient().get(f'/api/tickets/verify/{free.serial_number}/').status_code, 404)

    def test_ticket_search_and_cancel(self):
        self.assertEqual(self.client.get('/api/tickets/?search=GT').status_code, 200)
        self.assertEqual(self.client.post(f'/api/tickets/{self.ticket.id}/cancel_ticket/').status_code, 200)

    def test_new_serials_are_long(self):
        self.assertEqual(len(Ticket.objects.create().serial_number), 6 + 16)


@mock.patch('notifications.emails._ticket_pdf', mock.Mock(return_value=None))
class PaymentRuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_hr())

    def test_rejected_participant_cannot_be_marked_paid(self):
        _, rejected = make_participant('r@example.com', status=Participant.Status.REJECTED, active=False)
        free = Ticket.objects.create()
        r = self.client.post('/api/tickets/assign_ticket/',
                             {'participant_id': rejected.id, 'ticket_serial': free.serial_number}, format='json')
        self.assertEqual(r.status_code, 400)
        r = self.client.post('/api/payments/manual/', {'participant_id': rejected.id}, format='json')
        self.assertEqual(r.status_code, 400)
        rejected.refresh_from_db()
        self.assertEqual(rejected.status, Participant.Status.REJECTED)

    def test_manual_payment_reuses_a_free_ticket_and_emails(self):
        _, approved = make_participant('a@example.com')
        free = Ticket.objects.create()
        with self.captureOnCommitCallbacks(execute=True):
            r = self.client.post('/api/payments/manual/', {'participant_id': approved.id}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        free.refresh_from_db()
        self.assertEqual(free.participant, approved)
        self.assertIn(free.serial_number, mail.outbox[-1].body)
