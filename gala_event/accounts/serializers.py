from rest_framework import serializers
from django.contrib.auth import authenticate

from companies.models import Company
from .models import CustomUser
from participants.models import Participant

class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for all users (HR Admin and Participants)"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role_display',
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
        
        if not email or not password:
            raise serializers.ValidationError('Must include email and password.')
        
        # Normalize email
        email = email.strip().lower()
        
        # First check if user exists
        try:
            user_exists = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')
        
        # Try to authenticate
        user = authenticate(username=email, password=password)
        
        if not user:
            # User exists but wrong password
            raise serializers.ValidationError('Invalid email or password.')
        
        if not user.is_active:
            # Check if it's a participant who needs approval
            if user.role == CustomUser.Role.PARTICIPANT:
                if hasattr(user, 'participant_profile'):
                    if user.participant_profile.status == Participant.Status.PENDING:
                        raise serializers.ValidationError(
                            'Your account is pending approval. We will notify you via email once approved.'
                        )
                    elif user.participant_profile.status == Participant.Status.REJECTED:
                        raise serializers.ValidationError(
                            'Your account has been rejected.'
                        )
                raise serializers.ValidationError(
                    'Your account is not yet approved. We will notify you via email once activated.'
                )
            else:
                raise serializers.ValidationError('User account is disabled.')
        
        data['user'] = user
        return data
    
    def to_representation(self, instance):
        """Add role information to login response"""
        user = instance.get('user')
        if user:
            return {
                'id': user.id,
                'email': user.email,
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
            'id', 'first_name', 'last_name', 'email','field_of_study', 'university', 'graduation_year', 'linkedin_url', 
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



class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for companies to view/edit their own profile"""
    # Include user fields
    name = serializers.CharField(source='user.name')
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id', 'email', 'name', 'description', 
            'website', 'field', 'contact_person', 'phone', 'address', 'logo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']
    
