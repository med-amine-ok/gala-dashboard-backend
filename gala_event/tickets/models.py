from django.db import models
from django.utils import timezone
import uuid
import secrets
import string

def generate_serial_number():
    """Generate a unique ticket number"""
    return f"GT{timezone.now().year}{secrets.token_hex(4).upper()}"

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('cancelled', 'Cancelled'),
        ('checked_in', 'Checked In'),
    ]
    
    # Ticket Identity
    serial_number = models.CharField(max_length=20, unique=True, default=generate_serial_number)
    participant = models.OneToOneField('participants.Participant', on_delete=models.CASCADE, related_name='ticket')
    
    # # QR Code and Security
    # qr_code_data = models.TextField()  # JSON data encoded in QR
    # qr_code_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    # security_hash = models.CharField(max_length=64)  # For verification
    
    # Status and Usage
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    issued_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_in_tickets')
    
    
    # Email Delivery
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Ticket {self.serial_number} - {self.participant.full_name}"
    
    @property
    def is_valid(self):
        """Check if ticket is valid for use"""
        return self.status in ['active', 'checked_in']
    
    @property
    def is_used(self):
        """Check if ticket has been used"""
        return self.status in ['used', 'checked_in']
    
    def mark_as_used(self, user=None):
        """Mark ticket as used"""
        self.status = 'used'
        self.used_at = timezone.now()
        if user:
            self.checked_in_by = user
        self.save()
    
    def check_in(self, user=None):
        """Check in the participant"""
        self.status = 'checked_in'
        self.checked_in_at = timezone.now()
        if user:
            self.checked_in_by = user
        self.save()
    
    def cancel_ticket(self):
        """Cancel the ticket"""
        self.status = 'cancelled'
        self.save()
    
    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-created_at']

class TicketScan(models.Model):
    """Log of ticket scans for auditing"""
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='scans')
    scanned_by = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='ticket_scans')
    scan_datetime = models.DateTimeField(auto_now_add=True)
    scan_location = models.CharField(max_length=100, blank=True, null=True)  # Entry point
    scan_result = models.CharField(max_length=20, choices=[
        ('valid', 'Valid'),
        ('invalid', 'Invalid'),
        ('already_used', 'Already Used'),
        ('cancelled', 'Cancelled'),
    ])
    
    
    def __str__(self):
        return f"Scan {self.ticket.serial_number} - {self.scan_result}"
    
    class Meta:
        verbose_name = "Ticket Scan"
        verbose_name_plural = "Ticket Scans"
        ordering = ['-scan_datetime']