from rest_framework import serializers
from .models import Ticket, TicketScan
from participants.models import Participant
from accounts.models import CustomUser

class TicketSerializer(serializers.ModelSerializer):
    """Full serializer for Ticket operations"""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    participant_email = serializers.CharField(source='participant.email', read_only=True)
    checked_in_by_name = serializers.CharField(source='checked_in_by.username', read_only=True)
    is_valid = serializers.ReadOnlyField()
    is_used = serializers.ReadOnlyField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial_number', 'participant', 'participant_name', 
            'participant_email', 'status', 'issued_at', 'used_at', 
            'checked_in_at', 'checked_in_by', 'checked_in_by_name',
            'email_sent',
            'email_sent_at', 'is_valid', 'is_used', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'serial_number', 'participant_name', 'participant_email',
            'issued_at',
            'used_at', 'checked_in_at', 'checked_in_by_name', 'email_sent',
            'email_sent_at', 'is_valid', 'is_used', 'created_at', 'updated_at'
        ]

class TicketListSerializer(serializers.ModelSerializer):
    """Simplified serializer for ticket lists"""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    participant_email = serializers.CharField(source='participant.email', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'serial_number', 'participant_name', 'participant_email',
            'status',  'issued_at', 'checked_in_at'
        ]

class TicketStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating ticket status"""
    status = serializers.ChoiceField(choices=Ticket.STATUS_CHOICES)
   

class TicketCheckInSerializer(serializers.Serializer):
    """Serializer for ticket check-in"""
    serial_number = serializers.CharField()
    location = serializers.CharField(required=False, allow_blank=True)
   
    
    def validate_serial_number(self, value):
        """Validate ticket exists and is valid"""
        try:
            ticket = Ticket.objects.get(serial_number=value)
            if not ticket.is_valid:
                raise serializers.ValidationError(f"Ticket {value} is not valid for check-in.")
            return value
        except Ticket.DoesNotExist:
            raise serializers.ValidationError(f"Ticket {value} does not exist.")

# class QRCodeScanSerializer(serializers.Serializer):
#     """Serializer for QR code scanning"""
#     qr_data = serializers.CharField()
#     location = serializers.CharField(required=False, allow_blank=True)
    
#     def validate_qr_data(self, value):
#         """Validate QR code data"""
#         try:
#             # Here you would decode and validate the QR code data
#             # For now, we'll assume it contains the ticket number
#             return value
#         except Exception:
#             raise serializers.ValidationError("Invalid QR code data.")

class TicketScanSerializer(serializers.ModelSerializer):
    """Serializer for ticket scan logs"""
    serial_number = serializers.CharField(source='ticket.serial_number', read_only=True)
    participant_name = serializers.CharField(source='ticket.participant.full_name', read_only=True)
    scanned_by_name = serializers.CharField(source='scanned_by.username', read_only=True)
    
    class Meta:
        model = TicketScan
        fields = [
            'id', 'ticket', 'serial_number', 'participant_name',
            'scanned_by', 'scanned_by_name', 'scan_datetime', 
            'scan_location', 'scan_result'
        ]
        read_only_fields = [
            'id', 'serial_number', 'participant_name', 'scanned_by_name',
            'scan_datetime'
        ]

class BulkTicketActionSerializer(serializers.Serializer):
    """Serializer for bulk ticket operations"""
    ticket_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )
    action = serializers.ChoiceField(choices=[
        'activate', 'cancel', 'mark_used', 'check_in'
    ])
   

class TicketGenerationSerializer(serializers.Serializer):
    """Serializer for generating tickets for approved participants"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    generate_for_all_approved = serializers.BooleanField(default=False)
    send_email = serializers.BooleanField(default=True)
    
    def validate(self, data):
        if not data.get('generate_for_all_approved') and not data.get('participant_ids'):
            raise serializers.ValidationError(
                "Either provide participant_ids or set generate_for_all_approved to True."
            )
        return data


class GenerateUnassignedTicketsSerializer(serializers.Serializer):
    """Serializer for generating unassigned tickets"""
    count = serializers.IntegerField(
        min_value=1,
        max_value=200,
        help_text="Number of unassigned tickets to create (max 200)"
    )


class AssignTicketSerializer(serializers.Serializer):
    """Serializer for assigning an unassigned ticket to a participant"""
    participant_id = serializers.IntegerField(help_text="ID of the participant receiving the ticket")
    ticket_serial = serializers.CharField(help_text="Serial number of the unassigned ticket")
    reference = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Payment reference or description",
        default="Manual payment"
    )