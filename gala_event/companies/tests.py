from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CustomUser
from accounts.tests import make_participant
from companies.models import Company
from participants.models import Participant
from participants.tests import make_hr


class CompanyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(make_hr())

    def test_existing_account_email_is_refused(self):
        user, _ = make_participant('pat@example.com')
        user.set_password('Orig-pass-123')
        user.save()
        r = self.client.post('/api/companies/companies/',
                             {'name': 'Acme', 'email': 'PAT@example.com', 'password': 'Company-pass-1'}, format='json')
        self.assertEqual(r.status_code, 400)
        user.refresh_from_db()
        self.assertEqual(user.role, CustomUser.Role.PARTICIPANT)
        self.assertTrue(user.check_password('Orig-pass-123'))

    def test_create_profile_and_link(self):
        r = self.client.post('/api/companies/companies/',
                             {'name': 'Acme', 'email': 'hr@acme.dz', 'password': 'Company-pass-1'}, format='json')
        self.assertEqual(r.status_code, 201, r.json())
        self.assertEqual(self.client.post('/api/companies/companies/', {'name': 'acme', 'email': 'x@acme.dz'},
                                          format='json').status_code, 400)
        company_user = Company.objects.get().user
        client = APIClient()
        client.force_authenticate(company_user)
        self.assertEqual(client.get('/api/companies/profile/').status_code, 200)

        _, approved = make_participant('ok@example.com')
        _, pending = make_participant('wait@example.com', status=Participant.Status.PENDING, active=False)
        self.assertEqual(client.post(f'/api/companies/link-participant/{approved.id}/').status_code, 201)
        self.assertEqual(client.post(f'/api/companies/link-participant/{pending.id}/').status_code, 404)
        self.assertEqual(client.get('/api/companies/linked-participants/').json()['linked_participants_count'], 1)


class NotificationTests(TestCase):
    def test_users_cannot_create_notifications(self):
        user, _ = make_participant()
        client = APIClient()
        client.force_authenticate(user)
        r = client.post('/api/notifications/notifications/',
                        {'recipient': user.id, 'notification_type': 'system_alert', 'title': 'x', 'message': 'y'},
                        format='json')
        self.assertEqual(r.status_code, 405)
