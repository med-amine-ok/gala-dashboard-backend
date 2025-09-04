from rest_framework import permissions 
from .models import CustomUser


class IsHRAdmin(permissions.BasePermission):
    """
    Permission class that only allows HR Admin users to access the view.
    
    Use this for views that should only be accessible by HR Admins like:
    - Managing all participants
    - Viewing analytics/statistics
    - Approving/rejecting participants
    - Managing system settings
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has HR Admin role
        return request.user.role == CustomUser.Role.HR_ADMIN
    
    def has_object_permission(self, request, view, obj):
        # HR Admins can access any object
        return self.has_permission(request, view)


class IsParticipant(permissions.BasePermission):
    """
    Permission class that only allows Participant users to access the view.
    
    Use this for views that should only be accessible by Participants like:
    - Viewing their own profile
    - Updating their own information
    - Uploading CV files
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has Participant role
        return request.user.role == CustomUser.Role.PARTICIPANT
    
    def has_object_permission(self, request, view, obj):
        # Participants can access objects, but we'll check ownership in IsOwnerOrHRAdmin
        return self.has_permission(request, view)


class IsOwnerOrHRAdmin(permissions.BasePermission):
    """
    Permission class that allows:
    - HR Admins to access any object
    - Participants to only access their own objects
    
    Use this for views where participants should only see their own data,
    but HR Admins need to see everything for management purposes.
    """
    
    def has_permission(self, request, view):
        # Only authenticated users can access
        if not request.user.is_authenticated:
            return False
        
        # Both HR Admins and Participants can access (we'll check ownership at object level)
        return request.user.role in [CustomUser.Role.HR_ADMIN, CustomUser.Role.PARTICIPANT]
    
    def has_object_permission(self, request, view, obj):
        # HR Admins can access any object
        if request.user.role == CustomUser.Role.HR_ADMIN:
            return True
        
        # Participants can only access objects that belong to them
        if request.user.role == CustomUser.Role.PARTICIPANT:
            # Check if the object has a 'user' field that matches the current user
            if hasattr(obj, 'user'):
                return obj.user == request.user
            # If no user field, check if the object IS the user
            elif hasattr(obj, 'id') and hasattr(request.user, 'id'):
                return obj.id == request.user.id
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Anyone to read (GET requests)
    - Only owners to modify (POST, PUT, PATCH, DELETE)
    
    Useful for public information that users can read but only owners can edit.
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions only for authenticated users
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user


class IsHRAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Anyone to read (GET requests)
    - Only HR Admins to modify (POST, PUT, PATCH, DELETE)
    
    Useful for data that everyone can see but only HR can manage.
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions only for HR Admins
        return (request.user.is_authenticated and 
                request.user.role == CustomUser.Role.HR_ADMIN)


class CanManageParticipants(permissions.BasePermission):
    """
    Permission class specifically for participant management operations.
    
    Only HR Admins can:
    - Approve/reject participants
    - Change participant status
    - View all participant data
    - Export participant lists
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == CustomUser.Role.HR_ADMIN
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


# Helper function to check if user can access participant data
def can_access_participant_data(user, participant):
    """
    Helper function to check if a user can access specific participant data.
    
    Args:
        user: The user requesting access
        participant: The participant object being accessed
    
    Returns:
        bool: True if access is allowed, False otherwise
    """
    if not user.is_authenticated:
        return False
    
    # HR Admins can access any participant data
    if user.role == CustomUser.Role.HR_ADMIN:
        return True
    
    # Participants can only access their own data
    if user.role == CustomUser.Role.PARTICIPANT:
        return participant.user == user
    
    return False


# Helper function to get accessible participants for a user
def get_accessible_participants(user):
    """
    Helper function to get participants that a user can access.
    
    Args:
        user: The user requesting data
    
    Returns:
        QuerySet: Participants the user can access
    """
    from participants.models import Participant
    
    if not user.is_authenticated:
        return Participant.objects.none()
    
    # HR Admins can access all participants
    if user.role == CustomUser.Role.HR_ADMIN:
        return Participant.objects.all()
    
    # Participants can only access their own profile
    if user.role == CustomUser.Role.PARTICIPANT:
        return Participant.objects.filter(user=user)
    
    return Participant.objects.none()


# Permission combinations for common use cases
class ParticipantProfilePermissions(permissions.BasePermission):
    """
    Combined permission for participant profile operations:
    - Participants can read/write their own profile
    - HR Admins can read any profile but not write to it
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # HR Admins can only read participant profiles
        if request.user.role == CustomUser.Role.HR_ADMIN:
            return request.method in permissions.SAFE_METHODS
        
        # Participants can read/write their own profile
        if request.user.role == CustomUser.Role.PARTICIPANT:
            return obj.user == request.user
        
        return False