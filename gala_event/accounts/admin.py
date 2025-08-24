from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile, UserPermission


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for the User model with HR Admin functionality.
    """
    
    list_display = (
        'email', 'username', 'first_name', 'last_name', 'role', 
        'status', 'department', 'position', 'is_active', 'date_joined'
    )
    
    list_filter = (
        'role', 'status', 'department', 'is_active', 'is_staff', 
        'is_superuser', 'date_joined', 'hire_date'
    )
    
    search_fields = (
        'email', 'username', 'first_name', 'last_name', 
        'employee_id', 'department', 'position'
    )
    
    ordering = ('-date_joined',)
    
    # Fieldsets for the add form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'password1', 'password2', 
                'first_name', 'last_name', 'role', 'status'
            ),
        }),
    )
    
    # Fieldsets for the change form
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        (_('Personal info'), {
            'fields': (
                'first_name', 'last_name', 'email', 'date_of_birth'
            )
        }),
        (_('HR Information'), {
            'fields': (
                'role', 'status', 'employee_id', 'department', 
                'position', 'hire_date'
            )
        }),
        (_('Contact Information'), {
            'fields': (
                'phone_number', 'address_line1', 'address_line2', 
                'city', 'state', 'postal_code', 'country'
            )
        }),
        (_('Emergency Contact'), {
            'fields': (
                'emergency_contact_name', 'emergency_contact_phone', 
                'emergency_contact_relationship'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser', 'is_verified',
                'groups', 'user_permissions'
            )
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
        (_('Additional Information'), {
            'fields': ('last_login_ip', 'notes'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login_ip')
    
    # Actions for bulk operations
    actions = ['activate_users', 'deactivate_users', 'approve_users']
    
    def activate_users(self, request, queryset):
        """Activate selected users."""
        updated = queryset.update(status=User.Status.ACTIVE)
        self.message_user(
            request, 
            f'{updated} user(s) were successfully activated.'
        )
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        """Deactivate selected users."""
        updated = queryset.update(status=User.Status.INACTIVE)
        self.message_user(
            request, 
            f'{updated} user(s) were successfully deactivated.'
        )
    deactivate_users.short_description = "Deactivate selected users"
    
    def approve_users(self, request, queryset):
        """Approve pending users."""
        updated = queryset.filter(status=User.Status.PENDING).update(
            status=User.Status.ACTIVE
        )
        self.message_user(
            request, 
            f'{updated} user(s) were successfully approved.'
        )
    approve_users.short_description = "Approve pending users"
    
    def get_queryset(self, request):
        """Custom queryset with related profile data."""
        return super().get_queryset(request).select_related('profile')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin interface for UserProfile model.
    """
    
    list_display = (
        'user', 'preferred_language', 'timezone', 
        'skills_count', 'certifications_count', 'created_at'
    )
    
    list_filter = ('preferred_language', 'timezone', 'created_at')
    
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'bio')
    
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('user',)
        }),
        (_('Professional Information'), {
            'fields': ('bio', 'skills', 'certifications', 'education', 'work_experience')
        }),
        (_('Preferences'), {
            'fields': ('preferred_language', 'timezone', 'notification_preferences')
        }),
        (_('Social Media & Links'), {
            'fields': ('linkedin_url', 'github_url', 'personal_website')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def skills_count(self, obj):
        """Display count of skills."""
        return len(obj.get_skills_list())
    skills_count.short_description = 'Skills Count'
    
    def certifications_count(self, obj):
        """Display count of certifications."""
        return len(obj.certifications) if isinstance(obj.certifications, list) else 0
    certifications_count.short_description = 'Certifications Count'


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    """
    Admin interface for UserPermission model.
    """
    
    list_display = (
        'user', 'permission_name', 'is_active', 'granted_by', 
        'granted_at', 'expires_at', 'is_valid'
    )
    
    list_filter = ('is_active', 'permission_name', 'granted_at')
    
    search_fields = (
        'user__email', 'permission_name', 'permission_description'
    )
    
    readonly_fields = ('granted_at',)
    
    fieldsets = (
        (None, {
            'fields': ('user', 'permission_name', 'permission_description')
        }),
        (_('Permission Status'), {
            'fields': ('is_active', 'granted_by', 'granted_at', 'expires_at')
        }),
    )
    
    def is_valid(self, obj):
        """Display whether the permission is valid."""
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = 'Valid'
    
    def get_queryset(self, request):
        """Custom queryset with related user data."""
        return super().get_queryset(request).select_related('user', 'granted_by')
