from rest_framework import serializers
from participants.models import Participant


class DashboardParticipantSerializer(serializers.ModelSerializer):
    """
    Dedicated serializer for the dashboard participant table view
    Includes all necessary fields for the dashboard display and actions
    """
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    registration_date = serializers.DateTimeField(source='registered_at', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    approval_date = serializers.DateTimeField(source='approved_at', read_only=True)

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
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.full_name

    def get_email(self, obj):
        return obj.user.email if obj.user else obj.email

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None
