from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile, UserPermission


class CustomUserCreationForm(UserCreationForm):
    """
    Custom form for creating new users with HR Admin fields.
    """
    
    email = forms.EmailField(
        required=True,
        help_text=_('Required. Enter a valid email address.')
    )
    
    first_name = forms.CharField(
        max_length=30,
        required=True,
        help_text=_('Required. Enter your first name.')
    )
    
    last_name = forms.CharField(
        max_length=30,
        required=True,
        help_text=_('Required. Enter your last name.')
    )
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name', 'last_name', 
            'password1', 'password2', 'role', 'department', 'position'
        )
    
    def clean_email(self):
        """Ensure email is unique."""
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise ValidationError(_('A user with this email already exists.'))
        return email
    
    def clean_employee_id(self):
        """Ensure employee_id is unique if provided."""
        employee_id = self.cleaned_data.get('employee_id')
        if employee_id and User.objects.filter(employee_id=employee_id).exists():
            raise ValidationError(_('A user with this employee ID already exists.'))
        return employee_id
    
    def save(self, commit=True):
        """Save the user with default status."""
        user = super().save(commit=False)
        user.status = User.Status.PENDING  # Default status for new users
        if commit:
            user.save()
        return user


class CustomUserChangeForm(UserChangeForm):
    """
    Custom form for changing existing users.
    """
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'first_name', 'last_name', 'role', 
            'status', 'employee_id', 'department', 'position', 'hire_date',
            'phone_number', 'address_line1', 'address_line2', 'city', 
            'state', 'postal_code', 'country', 'date_of_birth',
            'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relationship', 'notes'
        )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make password field read-only in change form
        if 'password' in self.fields:
            self.fields['password'].help_text = _(
                "Raw passwords are not stored, so there is no way to see this "
                "user's password, but you can change the password using "
                "<a href=\"../password/\">this form</a>."
            )


class UserProfileForm(forms.ModelForm):
    """
    Form for managing user profile information.
    """
    
    class Meta:
        model = UserProfile
        fields = (
            'bio', 'skills', 'certifications', 'education', 'work_experience',
            'preferred_language', 'timezone', 'notification_preferences',
            'linkedin_url', 'github_url', 'personal_website'
        )
        widgets = {
            'skills': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter skills separated by commas'}),
            'certifications': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter certifications separated by commas'}),
            'education': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Enter education details'}),
            'work_experience': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Enter work experience'}),
            'notification_preferences': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Enter notification preferences as JSON'}),
        }
    
    def clean_skills(self):
        """Convert comma-separated skills to list."""
        skills = self.cleaned_data.get('skills')
        if skills:
            # Convert comma-separated string to list
            skills_list = [skill.strip() for skill in skills.split(',') if skill.strip()]
            return skills_list
        return []
    
    def clean_certifications(self):
        """Convert comma-separated certifications to list."""
        certifications = self.cleaned_data.get('certifications')
        if certifications:
            # Convert comma-separated string to list
            cert_list = [cert.strip() for cert in certifications.split(',') if cert.strip()]
            return cert_list
        return []
    
    def clean_notification_preferences(self):
        """Validate JSON format for notification preferences."""
        preferences = self.cleaned_data.get('notification_preferences')
        if preferences:
            try:
                import json
                if isinstance(preferences, str):
                    json.loads(preferences)
                return preferences
            except json.JSONDecodeError:
                raise ValidationError(_('Please enter valid JSON format for notification preferences.'))
        return {}


class UserPermissionForm(forms.ModelForm):
    """
    Form for managing custom user permissions.
    """
    
    class Meta:
        model = UserPermission
        fields = (
            'user', 'permission_name', 'permission_description', 
            'is_active', 'expires_at'
        )
        widgets = {
            'expires_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only show active users in the user field
        self.fields['user'].queryset = User.objects.filter(status=User.Status.ACTIVE)
    
    def clean_permission_name(self):
        """Ensure permission name is unique for the user."""
        permission_name = self.cleaned_data.get('permission_name')
        user = self.cleaned_data.get('user')
        
        if permission_name and user:
            existing = UserPermission.objects.filter(
                user=user, 
                permission_name=permission_name
            )
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise ValidationError(
                    _('This user already has a permission with this name.')
                )
        
        return permission_name


class UserSearchForm(forms.Form):
    """
    Form for searching and filtering users in HR Admin interface.
    """
    
    # Search fields
    search = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Search by name, email, employee ID...',
            'class': 'form-control'
        })
    )
    
    # Filter fields
    role = forms.ChoiceField(
        required=False,
        choices=[('', 'All Roles')] + list(User.Role.choices),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'All Statuses')] + list(User.Status.choices),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    department = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Filter by department',
            'class': 'form-control'
        })
    )
    
    is_active = forms.ChoiceField(
        required=False,
        choices=[
            ('', 'All'),
            ('True', 'Active Only'),
            ('False', 'Inactive Only')
        ],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    date_joined_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control'
        })
    )
    
    date_joined_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control'
        })
    )


class BulkUserActionForm(forms.Form):
    """
    Form for bulk actions on users (activate, deactivate, change role, etc.).
    """
    
    ACTION_CHOICES = [
        ('activate', 'Activate Users'),
        ('deactivate', 'Deactivate Users'),
        ('change_role', 'Change Role'),
        ('change_department', 'Change Department'),
        ('change_status', 'Change Status'),
    ]
    
    action = forms.ChoiceField(
        choices=ACTION_CHOICES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    new_role = forms.ChoiceField(
        required=False,
        choices=[('', 'Select Role')] + list(User.Role.choices),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    new_department = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter new department',
            'class': 'form-control'
        })
    )
    
    new_status = forms.ChoiceField(
        required=False,
        choices=[('', 'Select Status')] + list(User.Status.choices),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    def clean(self):
        """Validate form based on selected action."""
        cleaned_data = super().clean()
        action = cleaned_data.get('action')
        
        if action == 'change_role' and not cleaned_data.get('new_role'):
            raise ValidationError(_('Please select a new role.'))
        
        if action == 'change_department' and not cleaned_data.get('new_department'):
            raise ValidationError(_('Please enter a new department.'))
        
        if action == 'change_status' and not cleaned_data.get('new_status'):
            raise ValidationError(_('Please select a new status.'))
        
        return cleaned_data