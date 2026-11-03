from django.core.validators import RegexValidator
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Participant, Feedback, ParticipantImage

User = get_user_model()

OTHER = 'OTHER'

UNIVERSITY_CHOICES = [
    ('ENP', 'ENP'),
    ('ENSTA', 'ENSTA'),
    ('USTHB', 'USTHB'),
    ('ESAA', 'ESAA'),
    ('ENSTP', 'ENSTP'),
    (OTHER, 'Other'),
]
FIELD_OF_STUDY_CHOICES = [
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
    (OTHER, 'Other'),
]
ACADEMIC_LEVEL_CHOICES = [
    ('Bachelor’s Degree', 'Bachelor’s Degree'),
    ('Master’s Degree', 'Master’s Degree'),
    ('Engineering Degree', 'Engineering Degree'),
    ('PhD', 'PhD'),
    ('Postgraduate Studies (PGS)', 'Postgraduate Studies (PGS)'),
    (OTHER, 'Other'),
]
GRADUATION_YEAR_CHOICES = [(str(y), str(y)) for y in range(2023, 2029)] + [(OTHER, 'Other')]
CURRENT_YEAR_CHOICES = [('1', '1'), ('2', '2'), ('3', '3'), ('4', '4'), ('5', '5'), ('GRADUATED', 'Graduated')]
HEARD_ABOUT_CHOICES = [
    ('Facebook', 'Facebook'),
    ('Instagram', 'Instagram'),
    ('Through a Friend', 'Through a Friend'),
    ('LinkedIn', 'LinkedIn'),
    (OTHER, 'Other'),
]

# Fields students must answer; guests may leave them out
STUDENT_ONLY_FIELDS = ['university', 'field_of_study', 'academic_level', 'graduation_year']
# "OTHER" choice -> the matching free-text field becomes mandatory
OTHER_FIELDS = {
    'university': 'university_other',
    'field_of_study': 'field_of_study_other',
    'academic_level': 'academic_level_other',
    'graduation_year': 'graduation_year_other',
    'heard_about': 'heard_about_other',
}

LONG_TEXT = 3000

phone_validator = RegexValidator(
    r'^\+?[0-9][0-9\s\-().]{5,19}$',
    'Enter a valid phone number (digits, spaces, +, - only).',
)


class ParticipantRegistrationSerializer(serializers.Serializer):
    """
    Public registration: creates the (inactive) user account and the participant
    profile. Every length matches the database column so bad input is a 400,
    never a database error.
    """
    email = serializers.EmailField(max_length=254)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20, validators=[phone_validator])

    participant_type = serializers.ChoiceField(choices=Participant.ParticipantType.choices)

    university = serializers.ChoiceField(choices=UNIVERSITY_CHOICES, required=False, allow_blank=True)
    university_other = serializers.CharField(max_length=255, required=False, allow_blank=True)
    field_of_study = serializers.ChoiceField(choices=FIELD_OF_STUDY_CHOICES, required=False, allow_blank=True)
    field_of_study_other = serializers.CharField(max_length=255, required=False, allow_blank=True)
    academic_level = serializers.ChoiceField(choices=ACADEMIC_LEVEL_CHOICES, required=False, allow_blank=True)
    academic_level_other = serializers.CharField(max_length=255, required=False, allow_blank=True)
    graduation_year = serializers.ChoiceField(choices=GRADUATION_YEAR_CHOICES, required=False, allow_blank=True)
    graduation_year_other = serializers.CharField(max_length=50, required=False, allow_blank=True)
    current_year = serializers.ChoiceField(choices=CURRENT_YEAR_CHOICES, required=False, allow_blank=True)

    plans_next_year = serializers.CharField(max_length=LONG_TEXT)
    personal_description = serializers.CharField(max_length=LONG_TEXT, required=False, allow_blank=True)
    perspective_gala = serializers.CharField(max_length=LONG_TEXT)
    benefit_from_event = serializers.CharField(max_length=LONG_TEXT)
    attended_before = serializers.BooleanField(required=True)

    heard_about = serializers.ChoiceField(choices=HEARD_ABOUT_CHOICES)
    heard_about_other = serializers.CharField(max_length=255, required=False, allow_blank=True)

    additional_comments = serializers.CharField(max_length=LONG_TEXT, required=False, allow_blank=True)
    linkedin_url = serializers.URLField(max_length=200, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate(self, data):
        errors = {}
        if data.get('participant_type') == Participant.ParticipantType.STUDENT:
            for field in STUDENT_ONLY_FIELDS:
                if not data.get(field):
                    errors[field] = ["This field is required."]
        for choice_field, other_field in OTHER_FIELDS.items():
            if data.get(choice_field) == OTHER:
                if not (data.get(other_field) or '').strip():
                    errors[other_field] = ["Please specify."]
            else:
                # Drop stale "other" text when a listed option was chosen
                data[other_field] = ''
        if errors:
            raise serializers.ValidationError(errors)
        return data

    def create(self, validated_data):
        """Create new User and Participant profile"""
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name').strip()
        last_name = validated_data.pop('last_name').strip()

        # No usable password: the participant creates one in the app after
        # approval, proving inbox access with an emailed one-time code.
        user = User.objects.create_user(
            email=email,
            username=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False,
            role=User.Role.PARTICIPANT,
        )  # password=None -> unusable password

        return Participant.objects.create(
            user=user,
            email=email,
            first_name=first_name,
            last_name=last_name,
            **validated_data
        )


class ParticipantSerializer(serializers.ModelSerializer):
    """Full read-only view of a participant (HR Admin + the participant's own profile).
    Status, payment and approval fields are changed only through the dedicated
    approval / payment endpoints, never through this serializer."""
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    full_name = serializers.ReadOnlyField()
    is_approved = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, default=None)

    class Meta:
        model = Participant
        fields = [
            'id',
            'user',
            'first_name', 'last_name', 'email', 'phone',
            'field_of_study', 'field_of_study_other',
            'university', 'university_other',
            'academic_level', 'academic_level_other',
            'graduation_year', 'graduation_year_other', 'current_year',
            'participant_type',
            'plans_next_year', 'personal_description',
            'perspective_gala', 'benefit_from_event',
            'attended_before', 'heard_about', 'heard_about_other',
            'additional_comments', 'linkedin_url',
            'status', 'payment_status',
            'approved_by', 'approved_by_name', 'approved_at',
            'rejection_reason', 'registered_at', 'updated_at',
            'full_name', 'is_approved', 'is_paid'
        ]
        read_only_fields = fields

    def get_first_name(self, obj):
        return obj.user.first_name if obj.user else obj.first_name

    def get_last_name(self, obj):
        return obj.user.last_name if obj.user else obj.last_name

    def get_email(self, obj):
        return obj.user.email if obj.user else obj.email

    def get_is_approved(self, obj):
        return obj.status == Participant.Status.APPROVED

    def get_is_paid(self, obj):
        return obj.payment_status == 'paid'


class ParticipantSelfUpdateSerializer(serializers.ModelSerializer):
    """What a participant may change on their own profile. Everything that
    affects approval, payment or identity is deliberately absent."""
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=20, required=False, validators=[phone_validator])
    linkedin_url = serializers.URLField(max_length=200, required=False, allow_blank=True)
    personal_description = serializers.CharField(max_length=LONG_TEXT, required=False, allow_blank=True)

    class Meta:
        model = Participant
        fields = ['first_name', 'last_name', 'phone', 'linkedin_url', 'personal_description']

    def update(self, instance, validated_data):
        # Names live on both the user and the participant: keep them in sync
        user = instance.user
        for name in ('first_name', 'last_name'):
            if name in validated_data and user:
                setattr(user, name, validated_data[name])
        if user:
            user.save(update_fields=['first_name', 'last_name'])
        return super().update(instance, validated_data)


class ParticipantApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting a single participant"""
    action = serializers.ChoiceField(choices=['approved', 'rejected', 'pending'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'rejected' and not (data.get('rejection_reason') or '').strip():
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a participant.'
            })
        return data


class ParticipantBulkApprovalSerializer(ParticipantApprovalSerializer):
    """Serializer for bulk approval/rejection operations"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        max_length=1000,
    )


class ParticipantIdsSerializer(serializers.Serializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        max_length=1000,
    )


class FeedbackSerializer(serializers.ModelSerializer):
    feedback = serializers.CharField(max_length=LONG_TEXT)

    class Meta:
        model = Feedback
        fields = ["participant", "feedback", "submitted_at"]
        read_only_fields = ["participant", "submitted_at"]


class ParticipantWithTicketSerializer(ParticipantSerializer):
    """Serializer that includes ticket information with participant data"""
    ticket_serial_number = serializers.SerializerMethodField()
    ticket_status = serializers.SerializerMethodField()
    ticket_issued_at = serializers.SerializerMethodField()
    ticket_email_sent = serializers.SerializerMethodField()

    @staticmethod
    def _ticket(obj):
        return getattr(obj, 'ticket', None) if hasattr(obj, 'ticket') else None

    def get_ticket_serial_number(self, obj):
        ticket = self._ticket(obj)
        return ticket.serial_number if ticket else None

    def get_ticket_status(self, obj):
        ticket = self._ticket(obj)
        return ticket.status if ticket else None

    def get_ticket_issued_at(self, obj):
        ticket = self._ticket(obj)
        return ticket.issued_at if ticket else None

    def get_ticket_email_sent(self, obj):
        ticket = self._ticket(obj)
        return ticket.email_sent if ticket else None

    class Meta(ParticipantSerializer.Meta):
        fields = ParticipantSerializer.Meta.fields + [
            'ticket_serial_number', 'ticket_status', 'ticket_issued_at', 'ticket_email_sent'
        ]
        read_only_fields = fields


class ParticipantImageSerializer(serializers.ModelSerializer):
    """Serializer for individual participant images"""
    class Meta:
        model = ParticipantImage
        fields = ['id', 'image_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
