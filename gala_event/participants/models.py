from django.db import models
from django.conf import settings
import uuid



class Participant(models.Model):
    class ParticipantType(models.TextChoices):
        STUDENT = 'ST', 'Student'
        GUEST = 'G', 'Guest'
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
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    field_of_study = models.CharField(max_length=100, blank=True)
    university = models.CharField(max_length=255, blank=True)
    university_other = models.CharField(max_length=255, blank=True)
    field_of_study = models.CharField(max_length=255, blank=True)
    field_of_study_other = models.CharField(max_length=255, blank=True)
    academic_level = models.CharField(max_length=255, blank=True)
    academic_level_other = models.CharField(max_length=255, blank=True)
    graduation_year = models.CharField(max_length=50, blank=True)
    graduation_year_other = models.CharField(max_length=50, blank=True)
    plans_next_year = models.TextField(blank=True)
    personal_description = models.TextField(blank=True)
    perspective_gala = models.TextField(blank=True)
    benefit_from_event = models.TextField(blank=True)
    attended_before = models.BooleanField(default=False)
    heard_about = models.CharField(max_length=255, blank=True)
    heard_about_other = models.CharField(max_length=255, blank=True)
    additional_comments = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)
    cv_file = models.FileField(upload_to='cvs/', blank=True, null=True)
    participant_type = models.CharField(
        max_length=2, 
        choices=ParticipantType.choices, 
        default=ParticipantType.STUDENT
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
            return f"Participant {self.id} - {self.field_of_study or 'No title'}"

    @property
    def full_name(self):
        """Convenience property for participant's full name."""
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return ""

    class Meta:
        ordering = ['-registered_at']


class Feedback(models.Model):
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name="feedback_entries"
    )

    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        participant_name = getattr(self.participant, "full_name", "") or "Unknown participant"

        return f"Feedback by {participant_name}"

