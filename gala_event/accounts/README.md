# Accounts App - Custom User Model for HR Admin

This Django app provides a comprehensive custom User model with HR Admin functionality, role-based permissions, and extended profile management.

## Features

### 🏢 **Custom User Model**
- Extends Django's `AbstractUser`
- Role-based access control (Super Admin, HR Admin, HR Manager, HR Assistant, Employee, Guest)
- User status management (Active, Inactive, Suspended, Pending Approval)
- Employee ID and department tracking
- Comprehensive contact and address information
- Emergency contact details
- IP tracking for security

### 👥 **User Profile Management**
- Extended profile information (skills, certifications, education, work experience)
- Professional biography and social media links
- Notification preferences and timezone settings
- Automatic profile creation via signals

### 🔐 **Custom Permissions System**
- Granular permission control beyond Django's built-in permissions
- Time-based permission expiration
- Permission tracking (who granted, when granted)
- Permission validation and status checking

### 🛠️ **HR Admin Tools**
- Bulk user operations (activate, deactivate, approve, change roles)
- Advanced user search and filtering
- Department and role management
- User verification system

## Models

### User Model
The main custom user model with the following key fields:

```python
# Core fields
email = models.EmailField(unique=True, required=True)
role = models.CharField(choices=Role.choices, default=Role.EMPLOYEE)
status = models.CharField(choices=Status.choices, default=Status.PENDING)

# HR fields
employee_id = models.CharField(unique=True, blank=True, null=True)
department = models.CharField(max_length=100, blank=True)
position = models.CharField(max_length=100, blank=True)
hire_date = models.DateField(blank=True, null=True)

# Contact fields
phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
address_line1 = models.CharField(max_length=255, blank=True)
city = models.CharField(max_length=100, blank=True)
state = models.CharField(max_length=100, blank=True)
postal_code = models.CharField(max_length=20, blank=True)
country = models.CharField(max_length=100, blank=True, default='United States')

# Emergency contact
emergency_contact_name = models.CharField(max_length=100, blank=True)
emergency_contact_phone = models.CharField(max_length=17, blank=True)
emergency_contact_relationship = models.CharField(max_length=50, blank=True)

# System fields
is_verified = models.BooleanField(default=False)
last_login_ip = models.GenericIPAddressField(blank=True, null=True)
notes = models.TextField(blank=True)
```

### UserProfile Model
Extended profile information for users:

```python
# Professional information
bio = models.TextField(blank=True)
skills = models.JSONField(default=list, blank=True)
certifications = models.JSONField(default=list, blank=True)
education = models.JSONField(default=list, blank=True)
work_experience = models.JSONField(default=list, blank=True)

# Preferences
preferred_language = models.CharField(max_length=10, default='en')
timezone = models.CharField(max_length=50, default='UTC')
notification_preferences = models.JSONField(default=dict, blank=True)

# Social media
linkedin_url = models.URLField(blank=True)
github_url = models.URLField(blank=True)
personal_website = models.URLField(blank=True)
```

### UserPermission Model
Custom permissions beyond Django's built-in system:

```python
permission_name = models.CharField(max_length=100)
permission_description = models.TextField(blank=True)
is_active = models.BooleanField(default=True)
granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
granted_at = models.DateTimeField(auto_now_add=True)
expires_at = models.DateTimeField(null=True, blank=True)
```

## Usage

### Creating Users

```python
from accounts.models import User

# Create a regular user
user = User.objects.create_user(
    email='john.doe@company.com',
    username='johndoe',
    password='secure_password',
    first_name='John',
    last_name='Doe',
    role=User.Role.EMPLOYEE,
    department='Engineering',
    position='Software Developer'
)

# Create an HR Admin
hr_admin = User.objects.create_user(
    email='hr.admin@company.com',
    username='hradmin',
    password='secure_password',
    first_name='HR',
    last_name='Admin',
    role=User.Role.HR_ADMIN,
    department='Human Resources',
    position='HR Administrator'
)
```

### Role-Based Checks

```python
# Check if user is HR staff
if user.is_hr_staff():
    # User has HR role or higher
    pass

# Check if user can manage other users
if user.can_manage_users():
    # User can manage users
    pass

# Check if user can approve new registrations
if user.can_approve_users():
    # User can approve new users
    pass
```

### User Management

```python
# Get all active users
active_users = User.objects.get_active_users()

# Get HR staff
hr_staff = User.objects.get_hr_staff()

# Get users by department
engineering_users = User.objects.get_users_by_department('Engineering')

# Get pending users
pending_users = User.objects.get_pending_users()

# Get users by role
employees = User.objects.get_employees()
```

### Profile Management

```python
# Access user profile
profile = user.profile

# Add skills
profile.add_skill('Python')
profile.add_skill('Django')

# Get skills list
skills = profile.get_skills_list()

# Update bio
profile.bio = "Experienced software developer with 5+ years in Python development."
profile.save()
```

### Custom Permissions

```python
from accounts.models import UserPermission

# Grant a custom permission
permission = UserPermission.objects.create(
    user=user,
    permission_name='can_access_financial_data',
    permission_description='Access to financial reports and data',
    granted_by=hr_admin,
    expires_at=datetime.now() + timedelta(days=30)
)

# Check if permission is valid
if permission.is_valid():
    # Permission is active and not expired
    pass
```

## Admin Interface

The Django admin interface provides:

- **User Management**: Full user CRUD operations with role and status management
- **Profile Management**: Extended profile information editing
- **Permission Management**: Custom permission assignment and tracking
- **Bulk Operations**: Activate, deactivate, and approve multiple users
- **Advanced Filtering**: Search and filter users by various criteria

### Admin Actions

- **Activate Users**: Bulk activate selected users
- **Deactivate Users**: Bulk deactivate selected users  
- **Approve Users**: Approve pending user registrations

## Forms

### CustomUserCreationForm
For creating new users with HR fields:

```python
from accounts.forms import CustomUserCreationForm

form = CustomUserCreationForm(request.POST)
if form.is_valid():
    user = form.save()
    # User is created with PENDING status
```

### UserProfileForm
For managing user profile information:

```python
from accounts.forms import UserProfileForm

form = UserProfileForm(request.POST, instance=user.profile)
if form.is_valid():
    profile = form.save()
```

### UserSearchForm
For advanced user search and filtering:

```python
from accounts.forms import UserSearchForm

form = UserSearchForm(request.GET)
if form.is_valid():
    users = form.get_filtered_users()
```

## Signals

The app automatically:

- Creates a `UserProfile` when a `User` is created
- Handles user status and role changes
- Cleans up related data when users are deleted
- Manages permission changes and updates

## Configuration

### Settings

Add to your Django settings:

```python
INSTALLED_APPS = [
    # ... other apps
    'accounts',
]

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'
```

### Database Migration

After setting up the models:

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

### Create Superuser

```bash
python manage.py createsuperuser
```

The superuser will automatically be assigned:
- `role = SUPER_ADMIN`
- `status = ACTIVE`
- `is_staff = True`
- `is_superuser = True`

## Security Features

- **Email Verification**: Users can be marked as verified
- **IP Tracking**: Last login IP addresses are recorded
- **Status Management**: Users can be suspended or deactivated
- **Role-Based Access**: Granular permission control
- **Audit Trail**: Permission changes are tracked with timestamps

## Best Practices

1. **Always check user status** before allowing access to protected resources
2. **Use role-based checks** instead of hardcoded permission checks
3. **Validate user permissions** before performing sensitive operations
4. **Regularly review** custom permissions and remove expired ones
5. **Monitor user activity** through the admin interface

## Customization

### Adding New Roles

```python
class Role(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')
    HR_ADMIN = 'HR_ADMIN', _('HR Admin')
    HR_MANAGER = 'HR_MANAGER', _('HR Manager')
    HR_ASSISTANT = 'HR_ASSISTANT', _('HR Assistant')
    EMPLOYEE = 'EMPLOYEE', _('Employee')
    GUEST = 'GUEST', _('Guest')
    # Add your custom roles here
    CUSTOM_ROLE = 'CUSTOM_ROLE', _('Custom Role')
```

### Adding New Statuses

```python
class Status(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    INACTIVE = 'INACTIVE', _('Inactive')
    SUSPENDED = 'SUSPENDED', _('Suspended')
    PENDING = 'PENDING', _('Pending Approval')
    # Add your custom statuses here
    ON_LEAVE = 'ON_LEAVE', _('On Leave')
```

### Extending User Model

```python
class User(AbstractUser):
    # ... existing fields ...
    
    # Add your custom fields
    custom_field = models.CharField(max_length=100, blank=True)
    
    # Add your custom methods
    def custom_method(self):
        return f"Custom method for {self.get_full_name()}"
```

## Support

For questions or issues with the custom User model:

1. Check the Django documentation for custom user models
2. Review the model methods and properties
3. Check the admin interface for user management
4. Use the provided forms for user operations
5. Leverage the custom manager methods for common queries

## License

This code is part of the Gala Event project and follows the project's licensing terms.