from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission # Import Group and Permission
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    """Custom user model for HR Admins with additional fields and permissions"""
    email = models.EmailField(_('email address'), unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)

    can_approve_participants = models.BooleanField(default=True)
    can_manage_companies = models.BooleanField(default=True)
    can_manage_agenda = models.BooleanField(default=True)
    can_manage_tickets = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_full_name() or self.username

    class Meta:
        verbose_name = "HR Admin"
        verbose_name_plural = "HR Admins"
        ordering = ['-date_joined']