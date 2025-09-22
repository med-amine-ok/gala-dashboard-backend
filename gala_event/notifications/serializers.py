from rest_framework import serializers
from .models import EmailTemplate, EmailLog, Notification
from participants.models import Participant
from accounts.models import CustomUser

class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Email Templates"""
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'body_html', 
            'body_text', 'is_active', 'available_variables',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_available_variables(self, value):
        """Validate available_variables is a dict"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Available variables must be a dictionary.")
        return value

class EmailTemplateListSerializer(serializers.ModelSerializer):
    """Simplified serializer for email template lists"""
    
    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'template_type', 'subject', 'is_active']

class EmailLogSerializer(serializers.ModelSerializer):
    """Serializer for Email Logs"""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.username', read_only=True)
    template_name = serializers.CharField(source='template_used.name', read_only=True)
    is_delivered = serializers.ReadOnlyField()
    
    class Meta:
        model = EmailLog
        fields = [
            'id', 'recipient_email', 'recipient_name', 'subject', 
            'template_used', 'template_name', 'body_html', 'body_text',
            'status', 'sent_at', 'delivery_status', 'error_message',
            'participant', 'participant_name', 'sent_by', 'sent_by_name',
            'is_delivered', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'participant_name', 'sent_by_name', 'template_name',
            'is_delivered', 'sent_at', 'created_at', 'updated_at'
        ]

class EmailLogListSerializer(serializers.ModelSerializer):
    """Simplified serializer for email log lists"""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    template_name = serializers.CharField(source='template_used.name', read_only=True)
    
    class Meta:
        model = EmailLog
        fields = [
            'id', 'recipient_email', 'subject', 'template_name',
            'status', 'participant_name', 'sent_at', 'created_at'
        ]

class SendEmailSerializer(serializers.Serializer):
    """Serializer for sending emails"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    template_type = serializers.ChoiceField(
        choices=EmailTemplate.TEMPLATE_TYPES
    )
    custom_subject = serializers.CharField(required=False, allow_blank=True)
    custom_message = serializers.CharField(required=False, allow_blank=True)
    send_to_all = serializers.BooleanField(default=False)
    
    def validate(self, data):
        if not data.get('send_to_all') and not data.get('participant_ids'):
            raise serializers.ValidationError(
                "Either provide participant_ids or set send_to_all to True."
            )
        return data

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app notifications"""
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_name', 'notification_type',
            'title', 'message', 'is_read', 'read_at', 'participant',
            'participant_name', 'created_at'
        ]
        read_only_fields = [
            'id', 'recipient_name', 'participant_name', 'read_at', 'created_at'
        ]

class NotificationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for notification lists"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 
            'is_read', 'created_at'
        ]

class BulkEmailSerializer(serializers.Serializer):
    """Serializer for bulk email operations"""
    email_type = serializers.ChoiceField(choices=[
        'approval_notification',
        'rejection_notification', 
        'payment_reminder',
        'ticket_delivery',
        'event_reminder'
    ])
    participant_filters = serializers.DictField(required=False)
    custom_message = serializers.CharField(required=False, allow_blank=True)
    
    def validate_participant_filters(self, value):
        """Validate participant filters"""
        allowed_filters = [
            'status', 'payment_status', 
            'company', 'approved_after', 'approved_before'
        ]
        
        for key in value.keys():
            if key not in allowed_filters:
                raise serializers.ValidationError(f"Invalid filter: {key}")
        
        return value

class EmailPreviewSerializer(serializers.Serializer):
    """Serializer for email preview"""
    template_type = serializers.ChoiceField(choices=EmailTemplate.TEMPLATE_TYPES)
    participant_id = serializers.IntegerField()
    custom_variables = serializers.DictField(required=False, default=dict)