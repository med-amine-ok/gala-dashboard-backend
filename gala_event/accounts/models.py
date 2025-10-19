from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission 
from django.utils.translation import gettext_lazy as _



class CustomUser(AbstractUser):
    """Custom user model for HR Admins and Participants with additional fields"""

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Role(models.TextChoices):
        HR_ADMIN = 'HR', _('HR Admin')
        PARTICIPANT = 'P', _('Participant')

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