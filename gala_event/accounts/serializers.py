from rest_framework import serializers
from django.contrib.auth import authenticate

from companies.models import Company
from .models import CustomUser
from .services import DuplicateEmail, get_user_by_email
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

        try:
            user_exists = get_user_by_email(email)
        except DuplicateEmail:
            raise serializers.ValidationError(
                'Several accounts use this email. Please contact the organisers.'
            )
        if user_exists is None:
            raise serializers.ValidationError('Invalid email or password.')

        request = self.context.get('request')
        user = authenticate(request=request, username=user_exists.email, password=password)

        if not user:
            # authenticate() refuses inactive users. Only when the password is
            # right do we explain *why* the account can't log in yet.
            if not user_exists.is_active and user_exists.check_password(password):
                self._raise_inactive(user_exists)
            raise serializers.ValidationError('Invalid email or password.')

        data['user'] = user
        return data

    @staticmethod
    def _raise_inactive(user):
        if user.role == CustomUser.Role.PARTICIPANT and hasattr(user, 'participant_profile'):
            if user.participant_profile.status == Participant.Status.PENDING:
                raise serializers.ValidationError(
                    'Your account is pending approval. We will notify you via email once approved.'
                )
            if user.participant_profile.status == Participant.Status.REJECTED:
                raise serializers.ValidationError('Your account has been rejected.')
            raise serializers.ValidationError(
                'Your account is not yet approved. We will notify you via email once activated.'
            )
        raise serializers.ValidationError('User account is disabled.')

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


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for companies to view their own profile"""
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'email', 'name', 'description',
            'website', 'field', 'contact_person', 'phone', 'address', 'logo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']
