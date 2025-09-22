from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Participant

User = get_user_model()

class ParticipantRegistrationSerializer(serializers.Serializer):
    """
    Serializer for participant registration including user account creation
    """
    # User account fields
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    participant_type = serializers.ChoiceField(
        choices=Participant.ParticipantType.choices
    )
    job_title = serializers.CharField(required=False, allow_blank=True)
    university = serializers.CharField(required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    cv_file = serializers.FileField(required=False, allow_null=True)
    

    def validate_email(self, value):
        """
        Check if email is already registered
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        """
        Create new User and Participant profile
        """
        # Extract user data
        user_data = {
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'is_active': False,  # Always set to False initially - requires HR approval
            'role': 'P'  
        }

        # Set username as email and generate a random temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        user_data['username'] = user_data['email']
        user_data['password'] = temp_password
        
        # Create user account
        user = User.objects.create_user(**user_data)

        # Create participant profile
        participant = Participant.objects.create(user=user, **validated_data)
        return participant



class ParticipantSerializer(serializers.ModelSerializer):
    """Full serializer for participant management (HR Admin view)
    Aligns strictly with fields available on Participant and nested User.
    """
    # Read-only fields from related User
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    # Extra display helpers (these may be None if not defined as properties)
    full_name = serializers.ReadOnlyField()
    is_approved = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()

    # Approved by (user) display
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = Participant
        fields = [
            'id',
            
            'first_name', 'last_name', 'email', 'phone',
            
             'participant_type', 'job_title', 'university', 'graduation_year',
            'status', 'payment_status', 'cv_file', 'linkedin_url',
            
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            
            'full_name', 'is_approved', 'is_paid',
            'registered_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'approved_by_name', 'registered_at', 'updated_at',
            'full_name', 'is_approved', 'is_paid'
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
    """Serializer for HR Admin to add participants manually (Participant fields only).
    Note: Creating a Participant typically requires a related User to already exist.
    """
    # Show linked user info (read-only)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = Participant
        fields = [
            'first_name', 'last_name', 'email', 'phone',
             'participant_type', 'job_title', 'university',
            'graduation_year', 'status', 'payment_status', 'linkedin_url'
        ]
        read_only_fields = ['first_name', 'last_name', 'email', 'phone']


class ParticipantListSerializer(serializers.ModelSerializer):
    """Simplified serializer for participant lists"""
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Participant
        fields = [
            'id', 'first_name', 'last_name', 'email', 
            'status', 'payment_status', 'registered_at'
        ]