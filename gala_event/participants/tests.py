from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CustomUser
from accounts.tests import make_participant
from agenda.models import Agenda, AgendaRegistration
from participants.models import Feedback, Participant

# Exactly what gala-landing/src/app/register/page.tsx sends
LANDING_PAYLOAD = {
    'email': 'Alice@Example.com', 'first_name': 'Alice', 'last_name': 'A', 'phone': '+213 555 12 34 56',
    'participant_type': 'ST', 'university': 'ENP', 'university_other': '',
    'field_of_study': 'datascience_ai', 'field_of_study_other': '',
    'academic_level': 'Bachelor’s Degree', 'academic_level_other': '',
    'graduation_year': '2026', 'graduation_year_other': '', 'current_year': '3',
    'plans_next_year': 'x', 'personal_description': '', 'perspective_gala': 'y',
    'benefit_from_event': 'z', 'attended_before': False, 'heard_about': 'LinkedIn',
    'heard_about_other': '', 'additional_comments': '',
}


def make_hr():
    return CustomUser.objects.create_superuser(email='hr@example.com', password='Hr-pass-12345', first_name='H', last_name='R')


class RegistrationContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def post(self, **changes):
        return self.client.post('/api/participants/register/', dict(LANDING_PAYLOAD, **changes), format='json')

    def test_landing_payload_is_accepted_and_stored(self):
        r = self.post()
        self.assertEqual(r.status_code, 201, r.json())
        p = Participant.objects.get()
        self.assertEqual(p.email, 'alice@example.com')
        self.assertEqual(p.current_year, '3')
        self.assertEqual(p.status, Participant.Status.PENDING)
        self.assertFalse(p.user.is_active)
        self.assertFalse(p.user.has_usable_password())
        self.assertTrue(len(p.public_token) >= 30)

    def test_case_variant_email_is_a_duplicate(self):
        self.post()
        r = self.post(email='ALICE@example.com')
        self.assertEqual(r.status_code, 400)
        self.assertIn('email', r.json())

    def test_other_requires_text(self):
        r = self.post(university='OTHER', university_other='')
        self.assertEqual(r.status_code, 400)
        self.assertIn('university_other', r.json())
        r = self.post(university='OTHER', university_other='ESI')
        self.assertEqual(r.status_code, 201)

    def test_lengths_are_field_errors_not_server_errors(self):
        r = self.post(phone='0' * 25)
        self.assertEqual(r.status_code, 400)
        self.assertIn('phone', r.json())
        r = self.post(email='b@example.com', first_name='x' * 200)
        self.assertEqual(r.status_code, 400)
        self.assertIn('first_name', r.json())

    def test_guest_does_not_need_student_fields(self):
        payload = dict(LANDING_PAYLOAD, email='guest@example.com', participant_type='G')
        for field in ('university', 'field_of_study', 'academic_level', 'graduation_year'):
            payload.pop(field)
        r = self.client.post('/api/participants/register/', payload, format='json')
        self.assertEqual(r.status_code, 201, r.json())


class SelfServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.participant = make_participant()
        self.client.force_authenticate(self.user)

    def test_participant_cannot_change_status_or_payment(self):
        r = self.client.patch('/api/participants/profile/update/',
                              {'status': 'APPROVED', 'payment_status': 'paid', 'phone': '0555 000 111'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.participant.refresh_from_db()
        self.assertEqual(self.participant.payment_status, 'pending')
        self.assertEqual(self.participant.phone, '0555 000 111')

    def test_feedback_is_always_from_the_logged_in_participant(self):
        _, other = make_participant('other@example.com')
        r = self.client.post('/api/participants/feedback/', {'participant': other.id, 'feedback': 'hi'}, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Feedback.objects.get().participant, self.participant)
        anon = APIClient().post('/api/participants/feedback/', {'feedback': 'spam'}, format='json')
        self.assertEqual(anon.status_code, 401)

    def test_links_need_an_approved_target_and_not_self(self):
        _, pending = make_participant('pend@example.com', status=Participant.Status.PENDING, active=False)
        self.assertEqual(self.client.post(f'/api/participants/link-participant/{pending.id}/').status_code, 404)
        self.assertEqual(self.client.post(f'/api/participants/link-participant/{self.participant.id}/').status_code, 400)


class ApprovalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hr = make_hr()
        self.client.force_authenticate(self.hr)
        self.user, self.participant = make_participant(status=Participant.Status.PENDING, active=False)

    def act(self, action, **extra):
        return self.client.post(f'/api/participants/view/{self.participant.id}/approve_reject/',
                                dict(action=action, **extra), format='json')

    def test_approve_activates_and_emails_payment_link(self):
        with self.captureOnCommitCallbacks(execute=True):
            r = self.act('approved')
        self.assertEqual(r.status_code, 200)
        self.participant.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(self.participant.approved_by, self.hr)
        self.assertTrue(self.user.is_active)
        self.assertIn(self.participant.public_token, mail.outbox[-1].body)

    def test_pending_and_reject_deactivate(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.act('approved')
            self.act('pending')
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        self.assertEqual(self.act('rejected').status_code, 400)  # reason required
        with self.captureOnCommitCallbacks(execute=True):
            self.act('rejected', rejection_reason='Full')
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_dashboard_table_reject_also_deactivates(self):
        self.act('approved')
        r = self.client.post(f'/api/dashboard/participants-table/{self.participant.id}/action/',
                             {'action': 'reject', 'rejection_reason': 'No'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_search_and_delete_work(self):
        self.assertEqual(self.client.get('/api/participants/view/?search=pat').status_code, 200)
        agenda = Agenda.objects.create(title='t', start_time='2026-11-08T10:00Z', end_time='2026-11-08T11:00Z', place='A')
        AgendaRegistration.objects.create(agenda_item=agenda, participant=self.participant)
        r = self.client.delete(f'/api/participants/view/{self.participant.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(CustomUser.objects.filter(id=self.user.id).exists())

    def test_dashboard_counters(self):
        self.act('approved')
        stats = self.client.get('/api/dashboard/overview/').json()['quick_stats']
        self.assertEqual(stats['approved_participants'], 1)
        self.assertEqual(stats['pending_participants'], 0)
        self.assertEqual(self.client.get('/api/dashboard/recent-activity/?limit=abc').status_code, 200)

    def test_participants_cannot_use_admin_endpoints(self):
        client = APIClient()
        client.force_authenticate(self.user)
        self.assertEqual(client.get('/api/participants/view/').status_code, 403)
