from rest_framework import serializers
from .models import Participant
from companies.models import Company
from django.core.validators import validate_email

# class PaymentSerializer(serializers.ModelSerializer):
#     """Serializer for Payment details"""
    
#     class Meta:
#         model = Payment
#         fields = [
#             'id', 'amount', 'payment_method', 'transaction_id', 
#             'payment_date', 'payment_link', 'notes', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']

class ParticipantRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for participant registration (public form)"""
    
    class Meta:
        model = Participant
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'registration_type', 'job_title', 'university',
            'graduation_year', 'cv_file',
            'linkedin_url'
        ]
    
    def validate_email(self, value):
        """Check if email is already registered"""
        if Participant.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()
    
    def validate(self, data):
        """Cross-field validation"""
        registration_type = data.get('registration_type')
        
        # If student, university is required
        if registration_type == 'student' and not data.get('university'):
            raise serializers.ValidationError({
                'university': 'University is required for students.'
            })
        
        # If company rep, company and position are required
        if registration_type == 'company_rep':
            if not data.get('company'):
                raise serializers.ValidationError({
                    'company': 'Company is required for company representatives.'
                })
            if not data.get('position'):
                raise serializers.ValidationError({
                    'position': 'Position is required for company representatives.'
                })
        
        return data

class ParticipantSerializer(serializers.ModelSerializer):
    """Full serializer for participant management (HR Admin view)"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    # payment_details = PaymentSerializer(source='payment_details', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    full_name = serializers.ReadOnlyField()
    is_approved = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone_number', 'registration_type',
            'company_name', 'job_title', 'university', 'graduation_year',
            'status', 'payment_status', 'cv_file',
            'linkedin_url',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            'is_approved', 'is_paid', 
            'registered_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'full_name', 'is_approved', 'is_paid',
            'company_name', 'approved_by_name',
            'registered_at', 'updated_at'
        ]

class ParticipantApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting participants"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a participant.'
            })
        return data

class ParticipantCreateSerializer(serializers.ModelSerializer):
    """Serializer for HR Admin to add participants manually"""
    
    class Meta:
        model = Participant
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'registration_type','job_title', 'university',
            'graduation_year', 'status', 'payment_status',
            'linkedin_url'
        ]
    
    def validate_email(self, value):
        """Check if email is already registered"""
        if Participant.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()

class ParticipantListSerializer(serializers.ModelSerializer):
    """Simplified serializer for participant lists"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Participant
        fields = [
            'id','full_name', 'email', 'registration_type',
            'company_name', 'status', 'payment_status', 'created_at'
        ]

class BulkApprovalSerializer(serializers.Serializer):
    """Serializer for bulk approval/rejection"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required for bulk rejection.'
            })
        return data