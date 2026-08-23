from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission 
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import UserManager


class CustomUserManager(UserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        if email:
            email = self.normalize_email(email)
        username = extra_fields.pop('username', None) or email
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'HR')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        if email:
            email = self.normalize_email(email)
        username = extra_fields.pop('username', None) or email
        return self._create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    """Custom user model for HR Admins and Participants with additional fields"""

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Role(models.TextChoices):
        HR_ADMIN = 'HR', _('HR Admin')
        PARTICIPANT = 'P', _('Participant')
        COMPANY = 'C', _('Company')

    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=2, choices=Role.choices, default=Role.PARTICIPANT)
    created_at = models.DateTimeField(auto_now_add=True , blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    password_set = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
        
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-date_joined']