from rest_framework import serializers
from .models import Agenda, AgendaRegistration
from django.utils import timezone
from django.core.exceptions import ValidationError

class AgendaSerializer(serializers.ModelSerializer):
    """Full serializer for Agenda CRUD operations"""
    duration_minutes = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    speakers_names = serializers.ReadOnlyField()
    registrations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'title', 'description', 'start_time' , 
            'end_time', 'place','speakers',
            'duration_minutes', 'is_past', 
            'is_ongoing', 'speakers_names', 'registrations_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'duration_minutes', 'is_past', 'is_ongoing', 
            'speakers_names', 'registrations_count', 'created_at', 'updated_at'
        ]
    
    def get_registrations_count(self, obj):
        """Get count of registrations for this agenda item"""
        if obj.requires_registration:
            return obj.registrations.count()
        return None
    
    def validate(self, data):
        """Validate start and end datetime"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        
        if start_datetime and end_datetime:
            if end_datetime <= start_datetime:
                raise serializers.ValidationError({
                    'end_datetime': 'End datetime must be after start datetime.'
                })
        
        return data
    
    def validate_speakers(self, value):
        """Validate speakers JSON structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Speakers must be a list.")
        
        for speaker in value:
            if not isinstance(speaker, dict):
                raise serializers.ValidationError("Each speaker must be an object.")
            
            required_fields = ['name']
            for field in required_fields:
                if field not in speaker or not speaker[field].strip():
                    raise serializers.ValidationError(f"Speaker must have a '{field}' field.")
        
        return value

class AgendaListSerializer(serializers.ModelSerializer):
    """Simplified serializer for agenda lists"""
    duration_minutes = serializers.ReadOnlyField()
    speakers_names = serializers.ReadOnlyField()
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'title', 'start_time', 'end_time',
            'place', 'duration_minutes', 'speakers_names'
        ]

class AgendaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating agenda items"""
    
    class Meta:
        model = Agenda
        fields = [
            'title', 'description','start_time', 
            'end_time', 'place', 'speakers', 'capacity',
            'is_active'
        ]
    
    def validate_capacity(self, value):
        """Validate capacity is positive"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Capacity must be a positive number.")
        return value

class AgendaPublicSerializer(serializers.ModelSerializer):
    """Public serializer for participants to view agenda"""
    duration_minutes = serializers.ReadOnlyField()
    speakers_names = serializers.ReadOnlyField()
    
    class Meta:
        model = Agenda
        fields = [
            'id', 'title', 'description','start_time', 
            'end_time', 'place', 'speakers', 
            'duration_minutes', 'speakers_names'
        ]

class AgendaRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for agenda registrations"""
    participant_name = serializers.CharField(source='participant.full_name', read_only=True)
    agenda_title = serializers.CharField(source='agenda_item.title', read_only=True)
    
    class Meta:
        model = AgendaRegistration
        fields = [
            'id', 'agenda_item', 'participant', 'participant_name',
            'agenda_title', 'registered_at', 'attended', 'attendance_marked_at'
        ]
        read_only_fields = [
            'id', 'participant_name', 'agenda_title', 'registered_at',
            'attendance_marked_at'
        ]

class MarkAttendanceSerializer(serializers.Serializer):
    """Serializer for marking attendance"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    attended = serializers.BooleanField()