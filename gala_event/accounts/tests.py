import re

from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ActivationCode, CustomUser
from participants.models import Participant


def make_participant(email='p@example.com', status=Participant.Status.APPROVED, active=True, **extra):
    user = CustomUser.objects.create_user(
        email=email, first_name='Pat', last_name='Doe', role=CustomUser.Role.PARTICIPANT, is_active=active,
    )
    participant = Participant.objects.create(
        user=user, email=user.email, first_name='Pat', last_name='Doe', status=status, **extra,
    )
    return user, participant


def code_from_last_email():
    return re.search(r'\b(\d{6})\b', mail.outbox[-1].body).group(1)


class SetPasswordTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.participant = make_participant()

    def test_email_alone_never_sets_a_password(self):
        r = self.client.post('/api/accounts/set-password/', {'email': 'p@example.com', 'password': 'S3cure-pass!'}, format='json')
        self.assertEqual(r.status_code, 202)
        self.assertTrue(r.json()['code_required'])
        self.assertNotIn('access_token', r.json())
        self.user.refresh_from_db()
        self.assertFalse(self.user.password_set)
        self.assertFalse(self.user.has_usable_password())
        # The code went to the participant's inbox, and is not stored in the email log
        self.assertEqual(mail.outbox[-1].to, ['p@example.com'])
        self.assertEqual(ActivationCode.objects.count(), 1)

    def test_code_flow_sets_password_and_logs_in(self):
        self.client.post('/api/accounts/set-password/', {'email': 'P@Example.com'}, format='json')
        code = code_from_last_email()
        r = self.client.post('/api/accounts/set-password/',
                             {'email': 'p@example.com', 'code': code, 'password': 'S3cure-pass!'}, format='json')
        self.assertEqual(r.status_code, 200, r.json())
        self.assertIn('access_token', r.json())
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('S3cure-pass!'))
        self.assertTrue(self.user.password_set)
        # Second use is refused
        r = self.client.post('/api/accounts/set-password/',
                             {'email': 'p@example.com', 'code': code, 'password': 'Other-pass-99'}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_wrong_code_is_counted_and_locks(self):
        self.client.post('/api/accounts/set-password/', {'email': 'p@example.com'}, format='json')
        good = code_from_last_email()
        wrong = '000000' if good != '000000' else '111111'
        for _ in range(5):
            r = self.client.post('/api/accounts/set-password/',
                                 {'email': 'p@example.com', 'code': wrong, 'password': 'S3cure-pass!'}, format='json')
            self.assertEqual(r.status_code, 400)
        r = self.client.post('/api/accounts/set-password/',
                             {'email': 'p@example.com', 'code': good, 'password': 'S3cure-pass!'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('Too many', r.json()['error'])

    def test_weak_password_rejected(self):
        self.client.post('/api/accounts/set-password/', {'email': 'p@example.com'}, format='json')
        code = code_from_last_email()
        r = self.client.post('/api/accounts/set-password/',
                             {'email': 'p@example.com', 'code': code, 'password': '12345678'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_pending_participant_cannot_request_code(self):
        make_participant('pending@example.com', status=Participant.Status.PENDING, active=False)
        r = self.client.post('/api/accounts/set-password/', {'email': 'pending@example.com'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)

    def test_resend_cooldown(self):
        self.client.post('/api/accounts/set-password/', {'email': 'p@example.com'}, format='json')
        r = self.client.post('/api/accounts/set-password/', {'email': 'p@example.com'}, format='json')
        self.assertEqual(r.status_code, 429)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_login_is_case_insensitive(self):
        user, _ = make_participant('case@example.com')
        user.set_password('S3cure-pass!')
        user.save()
        r = self.client.post('/api/accounts/login/', {'email': 'CASE@example.com', 'password': 'S3cure-pass!'}, format='json')
        self.assertEqual(r.status_code, 200)

    def test_pending_message_only_after_correct_password(self):
        user, _ = make_participant('wait@example.com', status=Participant.Status.PENDING, active=False)
        user.set_password('S3cure-pass!')
        user.save()
        r = self.client.post('/api/accounts/login/', {'email': 'wait@example.com', 'password': 'wrong-one'}, format='json')
        self.assertIn('Invalid email or password.', str(r.json()))
        r = self.client.post('/api/accounts/login/', {'email': 'wait@example.com', 'password': 'S3cure-pass!'}, format='json')
        self.assertIn('pending approval', str(r.json()))

    def test_duplicate_case_emails_give_a_clear_error_not_500(self):
        CustomUser.objects.create(email='Dup@example.com', username='Dup@example.com')
        CustomUser.objects.create(email='dup@example.com', username='dup@example.com')
        r = self.client.post('/api/accounts/login/', {'email': 'dup@example.com', 'password': 'x'}, format='json')
        self.assertEqual(r.status_code, 400)
