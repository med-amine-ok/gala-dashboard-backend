from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta
from .models import UserProfile, UserPermission

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for the custom User model."""
    
    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': User.Role.EMPLOYEE,
            'department': 'Engineering',
            'position': 'Developer'
        }
    
    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.username, self.user_data['username'])
        self.assertEqual(user.role, User.Role.EMPLOYEE)
        self.assertEqual(user.status, User.Status.PENDING)
        self.assertFalse(user.is_verified)
        self.assertTrue(user.check_password('testpass123'))
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)
        self.assertEqual(superuser.role, User.Role.SUPER_ADMIN)
        self.assertEqual(superuser.status, User.Status.ACTIVE)
    
    def test_user_string_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.get_full_name()} ({user.email})"
        self.assertEqual(str(user), expected)
    
    def test_get_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.get_full_name(), 'Test User')
    
    def test_get_short_name(self):
        """Test get_short_name method."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.get_short_name(), 'Test')
    
    def test_role_based_methods(self):
        """Test role-based permission methods."""
        # Test regular employee
        employee = User.objects.create_user(**self.user_data)
        self.assertFalse(employee.is_hr_admin())
        self.assertFalse(employee.is_hr_staff())
        self.assertFalse(employee.can_manage_users())
        self.assertFalse(employee.can_approve_users())
        
        # Test HR Admin
        hr_admin_data = self.user_data.copy()
        hr_admin_data.update({
            'email': 'hr@example.com',
            'username': 'hradmin',
            'role': User.Role.HR_ADMIN,
            'status': User.Status.ACTIVE
        })
        hr_admin = User.objects.create_user(**hr_admin_data)
        self.assertTrue(hr_admin.is_hr_admin())
        self.assertTrue(hr_admin.is_hr_staff())
        self.assertTrue(hr_admin.can_manage_users())
        self.assertTrue(hr_admin.can_approve_users())
    
    def test_phone_number_validation(self):
        """Test phone number validation."""
        user_data = self.user_data.copy()
        user_data['phone_number'] = 'invalid_phone'
        
        with self.assertRaises(ValidationError):
            user = User.objects.create_user(**user_data)
            user.full_clean()
    
    def test_employee_id_uniqueness(self):
        """Test employee ID uniqueness."""
        user1 = User.objects.create_user(**self.user_data)
        user1.employee_id = 'EMP001'
        user1.save()
        
        user2_data = self.user_data.copy()
        user2_data.update({
            'email': 'user2@example.com',
            'username': 'user2'
        })
        user2 = User.objects.create_user(**user2_data)
        user2.employee_id = 'EMP001'
        
        with self.assertRaises(ValidationError):
            user2.full_clean()


class UserProfileTest(TestCase):
    """Test cases for the UserProfile model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_profile_creation(self):
        """Test that profile is automatically created."""
        self.assertTrue(hasattr(self.user, 'profile'))
        self.assertIsInstance(self.user.profile, UserProfile)
    
    def test_profile_string_representation(self):
        """Test profile string representation."""
        expected = f"Profile for {self.user.get_full_name()}"
        self.assertEqual(str(self.user.profile), expected)
    
    def test_skills_management(self):
        """Test skills management methods."""
        profile = self.user.profile
        
        # Test adding skills
        profile.add_skill('Python')
        profile.add_skill('Django')
        self.assertEqual(len(profile.get_skills_list()), 2)
        self.assertIn('Python', profile.get_skills_list())
        
        # Test removing skills
        profile.remove_skill('Python')
        self.assertEqual(len(profile.get_skills_list()), 1)
        self.assertNotIn('Python', profile.get_skills_list())
    
    def test_profile_fields(self):
        """Test profile field updates."""
        profile = self.user.profile
        profile.bio = "Experienced developer"
        profile.preferred_language = "en"
        profile.timezone = "UTC"
        profile.save()
        
        profile.refresh_from_db()
        self.assertEqual(profile.bio, "Experienced developer")
        self.assertEqual(profile.preferred_language, "en")
        self.assertEqual(profile.timezone, "UTC")


class UserPermissionTest(TestCase):
    """Test cases for the UserPermission model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.grantor = User.objects.create_user(
            email='grantor@example.com',
            username='grantor',
            password='grantorpass123',
            first_name='Grantor',
            last_name='User',
            role=User.Role.HR_ADMIN,
            status=User.Status.ACTIVE
        )
    
    def test_permission_creation(self):
        """Test creating a permission."""
        permission = UserPermission.objects.create(
            user=self.user,
            permission_name='test_permission',
            permission_description='Test permission description',
            granted_by=self.grantor
        )
        
        self.assertEqual(permission.user, self.user)
        self.assertEqual(permission.permission_name, 'test_permission')
        self.assertTrue(permission.is_active)
        self.assertEqual(permission.granted_by, self.grantor)
    
    def test_permission_string_representation(self):
        """Test permission string representation."""
        permission = UserPermission.objects.create(
            user=self.user,
            permission_name='test_permission',
            granted_by=self.grantor
        )
        
        expected = f"{self.user.email} - test_permission"
        self.assertEqual(str(permission), expected)
    
    def test_permission_expiration(self):
        """Test permission expiration logic."""
        # Test non-expiring permission
        permission = UserPermission.objects.create(
            user=self.user,
            permission_name='non_expiring',
            granted_by=self.grantor
        )
        self.assertFalse(permission.is_expired())
        self.assertTrue(permission.is_valid())
        
        # Test expired permission
        expired_permission = UserPermission.objects.create(
            user=self.user,
            permission_name='expired',
            granted_by=self.grantor,
            expires_at=timezone.now() - timedelta(days=1)
        )
        self.assertTrue(expired_permission.is_expired())
        self.assertFalse(expired_permission.is_valid())
        
        # Test future expiring permission
        future_permission = UserPermission.objects.create(
            user=self.user,
            permission_name='future_expiring',
            granted_by=self.grantor,
            expires_at=timezone.now() + timedelta(days=1)
        )
        self.assertFalse(future_permission.is_expired())
        self.assertTrue(future_permission.is_valid())
    
    def test_permission_uniqueness(self):
        """Test that permissions are unique per user."""
        UserPermission.objects.create(
            user=self.user,
            permission_name='unique_permission',
            granted_by=self.grantor
        )
        
        # Try to create another permission with the same name for the same user
        with self.assertRaises(ValidationError):
            duplicate_permission = UserPermission(
                user=self.user,
                permission_name='unique_permission',
                granted_by=self.grantor
            )
            duplicate_permission.full_clean()


class UserManagerTest(TestCase):
    """Test cases for the custom User manager."""
    
    def test_get_active_users(self):
        """Test getting active users."""
        # Create active user
        active_user = User.objects.create_user(
            email='active@example.com',
            username='activeuser',
            password='pass123',
            status=User.Status.ACTIVE
        )
        
        # Create inactive user
        inactive_user = User.objects.create_user(
            email='inactive@example.com',
            username='inactiveuser',
            password='pass123',
            status=User.Status.INACTIVE
        )
        
        active_users = User.objects.get_active_users()
        self.assertIn(active_user, active_users)
        self.assertNotIn(inactive_user, active_users)
    
    def test_get_hr_staff(self):
        """Test getting HR staff users."""
        # Create HR Admin
        hr_admin = User.objects.create_user(
            email='hr@example.com',
            username='hradmin',
            password='pass123',
            role=User.Role.HR_ADMIN,
            status=User.Status.ACTIVE
        )
        
        # Create regular employee
        employee = User.objects.create_user(
            email='emp@example.com',
            username='employee',
            password='pass123',
            role=User.Role.EMPLOYEE,
            status=User.Status.ACTIVE
        )
        
        hr_staff = User.objects.get_hr_staff()
        self.assertIn(hr_admin, hr_staff)
        self.assertNotIn(employee, hr_staff)
    
    def test_get_users_by_department(self):
        """Test getting users by department."""
        # Create users in different departments
        engineering_user = User.objects.create_user(
            email='eng@example.com',
            username='enguser',
            password='pass123',
            department='Engineering',
            status=User.Status.ACTIVE
        )
        
        hr_user = User.objects.create_user(
            email='hr@example.com',
            username='hruser',
            password='pass123',
            department='Human Resources',
            status=User.Status.ACTIVE
        )
        
        engineering_users = User.objects.get_users_by_department('Engineering')
        self.assertIn(engineering_user, engineering_users)
        self.assertNotIn(hr_user, engineering_users)
    
    def test_get_pending_users(self):
        """Test getting pending users."""
        # Create pending user
        pending_user = User.objects.create_user(
            email='pending@example.com',
            username='pendinguser',
            password='pass123',
            status=User.Status.PENDING
        )
        
        # Create active user
        active_user = User.objects.create_user(
            email='active@example.com',
            username='activeuser',
            password='pass123',
            status=User.Status.ACTIVE
        )
        
        pending_users = User.objects.get_pending_users()
        self.assertIn(pending_user, pending_users)
        self.assertNotIn(active_user, pending_users)
