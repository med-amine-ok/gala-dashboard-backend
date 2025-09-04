from rest_framework import serializers
from participants.models import Participant
from accounts.models import CustomUser

class DashboardParticipantSerializer(serializers.ModelSerializer):
    """
    Dedicated serializer for the dashboard participant table view
    Includes all necessary fields for the dashboard display and actions
    """
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email')
    registration_date = serializers.DateTimeField(source='registered_at')
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    approval_date = serializers.DateTimeField(source='approved_at')

    class Meta:
        model = Participant
        fields = [
            'id',
            'full_name',
            'email',
            'university',
            'graduation_year',
            'participant_type',
            'registration_date',
            'status',
            'approved_by_name',
            'approval_date',
            'rejection_reason',
        ]

    def get_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return ""

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip()
        return None
