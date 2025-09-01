from rest_framework import serializers
from .models import Participant


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
            # From related user
            'first_name', 'last_name', 'email', 'phone',
            # Participant fields
            'registration_type', 'participant_type', 'job_title', 'university', 'graduation_year',
            'status', 'payment_status', 'cv_file', 'linkedin_url',
            # Approval metadata
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            # Convenience / meta
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
            'registration_type', 'participant_type', 'job_title', 'university',
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
            'id', 'first_name', 'last_name', 'email', 'registration_type',
            'status', 'payment_status', 'registered_at'
        ]