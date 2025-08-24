from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser for HR Admin functionality.
    Includes role-based permissions and additional profile fields.
    """
    
    # Use custom manager
    objects = CustomUserManager()
    
    # Role choices for different user types
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')
        HR_ADMIN = 'HR_ADMIN', _('HR Admin')
        HR_MANAGER = 'HR_MANAGER', _('HR Manager')
        HR_ASSISTANT = 'HR_ASSISTANT', _('HR Assistant')
        EMPLOYEE = 'EMPLOYEE', _('Employee')
        GUEST = 'GUEST', _('Guest')
    
    # Status choices for user account
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('Active')
        INACTIVE = 'INACTIVE', _('Inactive')
        SUSPENDED = 'SUSPENDED', _('Suspended')
        PENDING = 'PENDING', _('Pending Approval')
    
    # Override email to make it unique and required
    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('Required. Enter a valid email address.')
    )
    
    # Role-based fields
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
        help_text=_('User role in the system')
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text=_('Current status of the user account')
    )
    
    # HR Admin specific fields
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text=_('Unique employee identifier')
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Department the user belongs to')
    )
    
    position = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Job position or title')
    )
    
    hire_date = models.DateField(
        blank=True,
        null=True,
        help_text=_('Date when the user was hired')
    )
    
    # Contact information
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text=_('Phone number')
    )
    
    # Address fields
    address_line1 = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Primary address line')
    )
    
    address_line2 = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Secondary address line (optional)')
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('City')
    )
    
    state = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('State or province')
    )
    
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Postal or ZIP code')
    )
    
    country = models.CharField(
        max_length=100,
        blank=True,
        default='United States',
        help_text=_('Country')
    )
    
    # Additional profile fields
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text=_('Date of birth')
    )
    
    emergency_contact_name = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Name of emergency contact')
    )
    
    emergency_contact_phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text=_('Emergency contact phone number')
    )
    
    emergency_contact_relationship = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Relationship to emergency contact')
    )
    
    # System fields
    is_verified = models.BooleanField(
        default=False,
        help_text=_('Whether the user email has been verified')
    )
    
    last_login_ip = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text=_('IP address of last login')
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_('Additional notes about the user')
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
            models.Index(fields=['department']),
            models.Index(fields=['employee_id']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name
    
    def is_hr_admin(self):
        """Check if user has HR Admin role or higher."""
        return self.role in [self.Role.HR_ADMIN, self.Role.SUPER_ADMIN]
    
    def is_hr_staff(self):
        """Check if user has any HR role."""
        return self.role in [
            self.Role.HR_ADMIN, 
            self.Role.HR_MANAGER, 
            self.Role.HR_ASSISTANT, 
            self.Role.SUPER_ADMIN
        ]
    
    def can_manage_users(self):
        """Check if user can manage other users."""
        return self.role in [
            self.Role.HR_ADMIN, 
            self.Role.HR_MANAGER, 
            self.Role.SUPER_ADMIN
        ]
    
    def can_approve_users(self):
        """Check if user can approve new user registrations."""
        return self.role in [
            self.Role.HR_ADMIN, 
            self.Role.HR_MANAGER, 
            self.Role.SUPER_ADMIN
        ]


class UserProfile(models.Model):
    """
    Extended profile information for users.
    This model provides additional fields that might not be needed for all users.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # Professional information
    bio = models.TextField(
        blank=True,
        help_text=_('Professional biography or summary')
    )
    
    skills = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of skills and competencies')
    )
    
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of professional certifications')
    )
    
    education = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Educational background')
    )
    
    work_experience = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Previous work experience')
    )
    
    # Preferences
    preferred_language = models.CharField(
        max_length=10,
        default='en',
        help_text=_('Preferred language for communication')
    )
    
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text=_('Preferred timezone')
    )
    
    notification_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('User notification preferences')
    )
    
    # Social media and external links
    linkedin_url = models.URLField(
        blank=True,
        help_text=_('LinkedIn profile URL')
    )
    
    github_url = models.URLField(
        blank=True,
        help_text=_('GitHub profile URL')
    )
    
    personal_website = models.URLField(
        blank=True,
        help_text=_('Personal website URL')
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
    
    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"
    
    def get_skills_list(self):
        """Return skills as a list."""
        return self.skills if isinstance(self.skills, list) else []
    
    def add_skill(self, skill):
        """Add a skill to the user's skills list."""
        if not isinstance(self.skills, list):
            self.skills = []
        if skill not in self.skills:
            self.skills.append(skill)
            self.save()
    
    def remove_skill(self, skill):
        """Remove a skill from the user's skills list."""
        if isinstance(self.skills, list) and skill in self.skills:
            self.skills.remove(skill)
            self.save()


class UserPermission(models.Model):
    """
    Custom permissions for users beyond Django's built-in permissions.
    This allows for more granular control over user capabilities.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_permissions'
    )
    
    permission_name = models.CharField(
        max_length=100,
        help_text=_('Name of the custom permission')
    )
    
    permission_description = models.TextField(
        blank=True,
        help_text=_('Description of what this permission allows')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this permission is currently active')
    )
    
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permissions_granted',
        help_text=_('User who granted this permission')
    )
    
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When this permission expires (optional)')
    )
    
    class Meta:
        verbose_name = _('User Permission')
        verbose_name_plural = _('User Permissions')
        unique_together = ['user', 'permission_name']
        indexes = [
            models.Index(fields=['user', 'permission_name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.permission_name}"
    
    def is_expired(self):
        """Check if the permission has expired."""
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False
    
    def is_valid(self):
        """Check if the permission is both active and not expired."""
        return self.is_active and not self.is_expired()
