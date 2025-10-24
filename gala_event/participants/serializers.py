from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Participant , Feedback

User = get_user_model()

class ParticipantRegistrationSerializer(serializers.Serializer):
    """
    Serializer for participant registration including user account creation
    """
    # User account fields
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()

    participant_type = serializers.ChoiceField(
        choices=Participant.ParticipantType.choices
    )
    field_of_study = serializers.CharField(required=False, allow_blank=True)

    university = serializers.ChoiceField(choices=[
        ('ENP', 'ENP'),
        ('ENSTA', 'ENSTA'),
        ('USTHB', 'USTHB'),
        ('ESAA', 'ESAA'),
        ('ENSTP', 'ENSTP'),
        ('OTHER', 'Other')
    ])
    university_other = serializers.CharField(required=False, allow_blank=True)

    field_of_study = serializers.ChoiceField(choices=[
        ('electrical', 'electrical'),
        ('electronics', 'electronics'),
        ('automotive', 'automotive'),
        ('automation', 'automation'),
        ('industrial', 'industrial'),
        ('datascience_ai', 'datascience_ai'),
        ('mechanical', 'mechanical'),
        ('chemical', 'chemical'),
        ('materials', 'materials'),
        ('civil', 'civil'),
        ('qhse', 'qhse'),
        ('environmental', 'environmental'),
        ('mining', 'mining'),
        ('hydraulics', 'hydraulics'),
        ('green_hydrogen', 'green_hydrogen'),
        ('OTHER', 'Other')
    ])
    field_of_study_other = serializers.CharField(required=False, allow_blank=True)

    academic_level = serializers.ChoiceField(choices=[
        ('Bachelor’s Degree', 'Bachelor’s Degree'),
        ('Master’s Degree', 'Master’s Degree'),
        ('Engineering Degree', 'Engineering Degree'),
        ('PhD', 'PhD'),
        ('Postgraduate Studies (PGS)', 'Postgraduate Studies (PGS)'),
        ('OTHER', 'Other')
    ])
    academic_level_other = serializers.CharField(required=False, allow_blank=True)

    graduation_year = serializers.ChoiceField(choices=[
        ('2023', '2023'),
        ('2024', '2024'),
        ('2025', '2025'),
        ('2026', '2026'),
        ('2027', '2027'),
        ('2028', '2028'),
        ('OTHER', 'Other')
    ])
    graduation_year_other = serializers.CharField(required=False, allow_blank=True)

    plans_next_year = serializers.CharField(required=True)
    personal_description = serializers.CharField(required=False, allow_blank=True)
    perspective_gala = serializers.CharField(required=True)
    benefit_from_event = serializers.CharField(required=True)
    attended_before = serializers.BooleanField(required=True)

    heard_about = serializers.ChoiceField(choices=[
        ('Facebook', 'Facebook'),
        ('Instagram', 'Instagram'),
        ('Through a Friend', 'Through a Friend'),
        ('LinkedIn', 'LinkedIn'),
        ('OTHER', 'Other')
    ])
    heard_about_other = serializers.CharField(required=False, allow_blank=True)

    additional_comments = serializers.CharField(required=False, allow_blank=True)

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
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')

        user_data = {
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'is_active': False,  # Always set to False initially - requires HR approval
            'role': 'P'
        }

        # Set username as email and generate a random temporary password
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        user_data['username'] = email
        user_data['password'] = temp_password
        
        # Create user account
        user = User.objects.create_user(**user_data)

        # Create participant profile
        participant = Participant.objects.create(
            user=user,
            email=email,
            first_name=first_name,
            last_name=last_name,
            **validated_data
        )
        return participant



class ParticipantSerializer(serializers.ModelSerializer):
    """Full serializer for participant management (HR Admin view)
    Aligns strictly with fields available on Participant and nested User.
    """
    # Read-only fields from related User
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField( read_only=True)

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
            'user',
            'first_name', 'last_name', 'email', 'phone',
            'field_of_study', 'field_of_study_other',
            'university', 'university_other',
            'academic_level', 'academic_level_other',
            'graduation_year', 'graduation_year_other',
            'participant_type',
            'plans_next_year', 'personal_description',
            'perspective_gala', 'benefit_from_event',
            'attended_before', 'heard_about', 'heard_about_other',
            'additional_comments', 'linkedin_url', 'cv_file',
            'status', 'payment_status',
            'approved_by', 'approved_by_name', 'approved_at',
            'rejection_reason', 'registered_at', 'updated_at',
            'full_name', 'is_approved', 'is_paid'
        ]
        read_only_fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'approved_by_name', 'registered_at', 'updated_at',
            'full_name', 'is_approved', 'is_paid'
        ]


class ParticipantApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting a single participant"""
    action = serializers.ChoiceField(choices=['approved', 'rejected', 'pending'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'rejected' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a participant.'
            })
        return data


class ParticipantBulkApprovalSerializer(serializers.Serializer):
    """Serializer for bulk approval/rejection operations"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False
    )
    action = serializers.ChoiceField(choices=['approved', 'rejected', 'pending'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'rejected':
            rejection_reason = data.get('rejection_reason', '').strip()
            if not rejection_reason:
                raise serializers.ValidationError({
                    'rejection_reason': "Rejection reason is required when rejecting participants."
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
            'participant_type', 'field_of_study', 'university',
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


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["participant","feedback", "submitted_at"]
        read_only_fields = ["submitted_at"]