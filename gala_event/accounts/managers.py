from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager for the User model.
    Provides methods for creating users and superusers.
    """
    
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Create and save a regular user with the given email, username and password.
        """
        if not email:
            raise ValueError(_('The Email field must be set'))
        
        if not username:
            raise ValueError(_('The Username field must be set'))
        
        # Normalize email
        email = self.normalize_email(email)
        
        # Create user instance
        user = self.model(
            email=email,
            username=username,
            **extra_fields
        )
        
        # Set password
        user.set_password(password)
        
        # Save user
        user.save(using=self._db)
        
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email, username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        extra_fields.setdefault('status', 'ACTIVE')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        if extra_fields.get('is_active') is not True:
            raise ValueError(_('Superuser must have is_active=True.'))
        
        return self.create_user(email, username, password, **extra_fields)
    
    def get_active_users(self):
        """Get all active users."""
        return self.filter(status='ACTIVE', is_active=True)
    
    def get_hr_staff(self):
        """Get all HR staff users."""
        return self.filter(
            role__in=['HR_ADMIN', 'HR_MANAGER', 'HR_ASSISTANT', 'SUPER_ADMIN'],
            status='ACTIVE',
            is_active=True
        )
    
    def get_pending_users(self):
        """Get all users with pending status."""
        return self.filter(status='PENDING')
    
    def get_users_by_department(self, department):
        """Get all users in a specific department."""
        return self.filter(department=department, status='ACTIVE', is_active=True)
    
    def get_users_by_role(self, role):
        """Get all users with a specific role."""
        return self.filter(role=role, status='ACTIVE', is_active=True)
    
    def get_employees(self):
        """Get all regular employees."""
        return self.filter(role='EMPLOYEE', status='ACTIVE', is_active=True)
    
    def get_guests(self):
        """Get all guest users."""
        return self.filter(role='GUEST', status='ACTIVE', is_active=True)
    
    def get_verified_users(self):
        """Get all verified users."""
        return self.filter(is_verified=True, status='ACTIVE', is_active=True)
    
    def get_users_created_in_date_range(self, start_date, end_date):
        """Get users created within a date range."""
        return self.filter(
            created_at__date__range=[start_date, end_date]
        )
    
    def get_users_by_hire_date_range(self, start_date, end_date):
        """Get users hired within a date range."""
        return self.filter(
            hire_date__range=[start_date, end_date],
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_with_employee_id(self):
        """Get all users who have an employee ID assigned."""
        return self.filter(
            employee_id__isnull=False,
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_without_employee_id(self):
        """Get all users without an employee ID assigned."""
        return self.filter(
            employee_id__isnull=True,
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_by_status(self, status):
        """Get all users with a specific status."""
        return self.filter(status=status)
    
    def get_users_by_activity_status(self, is_active):
        """Get users by their Django is_active status."""
        return self.filter(is_active=is_active)
    
    def get_recent_users(self, days=30):
        """Get users created in the last N days."""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff_date)
    
    def get_users_with_phone(self):
        """Get all users who have provided a phone number."""
        return self.filter(
            phone_number__isnull=False,
            phone_number__gt='',
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_with_address(self):
        """Get all users who have provided address information."""
        return self.filter(
            address_line1__isnull=False,
            address_line1__gt='',
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_by_location(self, city=None, state=None, country=None):
        """Get users by location criteria."""
        filters = {'status': 'ACTIVE', 'is_active': True}
        
        if city:
            filters['city'] = city
        if state:
            filters['state'] = state
        if country:
            filters['country'] = country
        
        return self.filter(**filters)
    
    def get_users_needing_verification(self):
        """Get all users who haven't been verified yet."""
        return self.filter(
            is_verified=False,
            status='ACTIVE',
            is_active=True
        )
    
    def get_users_with_emergency_contact(self):
        """Get all users who have provided emergency contact information."""
        return self.filter(
            emergency_contact_name__isnull=False,
            emergency_contact_name__gt='',
            status='ACTIVE',
            is_active=True
        )