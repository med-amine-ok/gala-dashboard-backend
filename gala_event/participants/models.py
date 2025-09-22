from django.db import models
from django.conf import settings
import uuid



class Participant(models.Model):
    class ParticipantType(models.TextChoices):
        STUDENT = 'ST', 'Student'
        PROFESSIONAL = 'PR', 'Professional'
        
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='participant_profile', 
        null=True, 
        blank=True
    )
    job_title = models.CharField(max_length=100, blank=True)
    university = models.CharField(max_length=255, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    linkedin_url = models.URLField(blank=True)
    cv_file = models.FileField(upload_to='cvs/', blank=True, null=True)
    participant_type = models.CharField(
        max_length=2, 
        choices=ParticipantType.choices, 
        default=ParticipantType.PROFESSIONAL
    )
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING
    )

    payment_status = models.CharField(
        max_length=50,
        choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed")],
        default="pending"
    )

    # This will be the HR Admin who approved the participant
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_participants'
    )
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        if self.user:
            return f"{self.user.first_name} {self.user.last_name} ({self.user.email})"
        else:
            return f"Participant {self.id} - {self.job_title or 'No title'}"

    @property
    def full_name(self):
        """Convenience property for participant's full name from linked user."""
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        return ""

    @property
    def email(self):
        """Convenience property for participant's email from linked user."""
        return self.user.email if self.user else ""

    class Meta:
        ordering = ['-registered_at']

