from django.db import models
from django.conf import settings
import uuid

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    # For array-like fields, JSONField is a good, flexible choice.
    hiring_positions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']


class Participant(models.Model):
    class ParticipantType(models.TextChoices):
        STUDENT = 'ST', 'Student'
        PROFESSIONAL = 'PR', 'Professional'
        


    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    linked_in = models.URLField(blank=True)
    participant_type = models.CharField(max_length=2, choices=ParticipantType.choices, default=ParticipantType.PROFESSIONAL)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

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

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    class Meta:
        ordering = ['-registered_at']


class Ticket(models.Model):
    class PaymentStatus(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PAID = 'PAID', 'Paid'
        WAIVED = 'WAIVED', 'Waived'

    class TicketStatus(models.TextChoices):
        VALID = 'VALID', 'Valid'
        USED = 'USED', 'Used'
        CANCELED = 'CANCELED', 'Canceled'
        CHECKED_IN = 'CHECKED_IN', 'Checked-In'

    participant = models.OneToOneField(Participant, on_delete=models.CASCADE, related_name='event_ticket') # Changed related_name
    ticket_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    
    payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    ticket_status = models.CharField(max_length=10, choices=TicketStatus.choices, default=TicketStatus.VALID)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket for {self.participant.email}"