from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission # Import Group and Permission
from django.utils.translation import gettext_lazy as _



class CustomUser(AbstractUser):
    """Custom user model for HR Admins and Participants with additional fields"""

    class Role(models.TextChoices):
        HR_ADMIN = 'HR', _('HR Admin')
        PARTICIPANT = 'P', _('Participant')

    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=2, choices=Role.choices, default=Role.PARTICIPANT)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True , blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
        
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-date_joined']