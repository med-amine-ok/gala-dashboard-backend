from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser
from participants.models import Participant

class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for all users (HR Admin and Participants)"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'role_display',
            'is_active', 'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    """Serializer for both HR Admin and Participant login"""
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # We set username=email at registration, so authenticate using username
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Your account is not yet approved and is not active until you are approved. We will inform you via email once your account is activated.')
        else:
            raise serializers.ValidationError('Must include email and password.')
    
    def to_representation(self, instance):
        """Add role information to login response"""
        user = instance.get('user')
        if user:
            return {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'role_display': user.get_role_display(),
            }
        return super().to_representation(instance)

class ParticipantProfileSerializer(serializers.ModelSerializer):
    """Serializer for participants to view/edit their own profile"""
    # Include user fields
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email', read_only=True)  
    
    # Include participant fields
    class Meta:
        model = Participant
        fields = [
            'id', 'first_name', 'last_name', 'email','job_title', 'university', 'graduation_year', 'linkedin_url', 
            'cv_file', 'participant_type', 
            'registered_at'
        ]
        read_only_fields = ['id', 'email', 'registered_at']
    
    def update(self, instance, validated_data):
        """Update both User and Participant data"""
        # Update user fields
        user_data = {
            'first_name': validated_data.pop('user', {}).get('first_name', instance.user.first_name),
            'last_name': validated_data.pop('user', {}).get('last_name', instance.user.last_name),
        }
        
        # Update the user
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        
        # Update participant fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

class ParticipantRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for participant registration (creates both User and Participant)"""
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    
    # Participant fields
    job_title = serializers.CharField()
    university = serializers.CharField(required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    cv_file = serializers.FileField(required=False)
    
    class Meta:
        model = Participant
        fields = [
            'email', 'password', 'first_name', 'last_name', 'job_title', 'university', 'graduation_year', 'linkedin_url',
            'cv_file', 'participant_type'
        ]

    def validate_email(self, value):
        # Normalize and ensure uniqueness
        email = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email
    
    def create(self, validated_data):
        """Create both User and Participant records"""
        # Extract user data
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        

        # Build user data, using email as username
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            
            role=CustomUser.Role.PARTICIPANT,
        )

        # Remaining validated_data are Participant fields
        participant = Participant.objects.create(user=user, **validated_data)
        return participant
