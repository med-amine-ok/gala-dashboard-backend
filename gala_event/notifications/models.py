from django.db import models

class EmailTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('registration_confirmation', 'Registration Confirmation'),
        ('approval_notification', 'Approval Notification'),
        ('rejection_notification', 'Rejection Notification'),
        ('payment_reminder', 'Payment Reminder'),
        ('ticket_delivery', 'Ticket Delivery'),
        ('event_reminder', 'Event Reminder'),
        ('event_update', 'Event Update'),
        ('payment_confirmation', 'Payment Confirmation'),
    ]
    
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES, unique=True)
    subject = models.CharField(max_length=200)
    body_html = models.TextField()  # HTML email body
    body_text = models.TextField()  # Plain text fallback
    is_active = models.BooleanField(default=True)
    
    # Template variables help text
    available_variables = models.JSONField(default=dict, blank=True)  # Available template variables
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    class Meta:
        verbose_name = "Email Template"
        verbose_name_plural = "Email Templates"
        ordering = ['template_type']

class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]
    
    # Email Details
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=100, blank=True, null=True)
    subject = models.CharField(max_length=200)
    template_used = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Content
    body_html = models.TextField(blank=True, null=True)
    body_text = models.TextField(blank=True, null=True)
    
    # Status and Delivery
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.TextField(blank=True, null=True)  # Provider response
    error_message = models.TextField(blank=True, null=True)
    
    # Relationships
    participant = models.ForeignKey('participants.Participant', on_delete=models.CASCADE, null=True, blank=True, related_name='emails')
    sent_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails')
    
    
    # System Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Email to {self.recipient_email} - {self.subject}"
    
    @property
    def is_delivered(self):
        return self.status == 'sent'
    
    class Meta:
        verbose_name = "Email Log"
        verbose_name_plural = "Email Logs"
        ordering = ['-created_at']

class Notification(models.Model):
    """In-app notifications for HR Admins"""
    NOTIFICATION_TYPES = [
        ('payment_received', 'Payment Received'),
        ('ticket_scanned', 'Ticket Scanned'),
        ('system_alert', 'System Alert'),
    ]
    
    recipient = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional relationships
    participant = models.ForeignKey('participants.Participant', on_delete=models.CASCADE, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Notification for {self.recipient.username} - {self.title}"
    
    def mark_as_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
    
    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']