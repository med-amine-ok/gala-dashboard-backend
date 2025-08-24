from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile, UserPermission

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a UserProfile when a new User is created.
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Automatically save the UserProfile when the User is saved.
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(post_save, sender=User)
def update_user_status(sender, instance, **kwargs):
    """
    Handle status changes and send notifications if needed.
    """
    if not kwargs.get('created'):
        # User was updated, check if status changed
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Status changed, you could add notification logic here
                pass
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def handle_role_change(sender, instance, **kwargs):
    """
    Handle role changes and update permissions accordingly.
    """
    if not kwargs.get('created'):
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if old_instance.role != instance.role:
                # Role changed, you could add logic to update permissions here
                pass
        except User.DoesNotExist:
            pass


@receiver(post_delete, sender=User)
def delete_user_profile(sender, instance, **kwargs):
    """
    Clean up UserProfile when User is deleted.
    """
    try:
        if hasattr(instance, 'profile'):
            instance.profile.delete()
    except UserProfile.DoesNotExist:
        pass


@receiver(post_delete, sender=User)
def delete_user_permissions(sender, instance, **kwargs):
    """
    Clean up UserPermissions when User is deleted.
    """
    UserPermission.objects.filter(user=instance).delete()


@receiver(post_save, sender=UserPermission)
def handle_permission_change(sender, instance, **kwargs):
    """
    Handle permission changes and send notifications if needed.
    """
    if not kwargs.get('created'):
        # Permission was updated
        try:
            old_instance = UserPermission.objects.get(pk=instance.pk)
            if old_instance.is_active != instance.is_active:
                # Permission status changed
                pass
        except UserPermission.DoesNotExist:
            pass


@receiver(post_save, sender=UserProfile)
def handle_profile_update(sender, instance, **kwargs):
    """
    Handle profile updates and send notifications if needed.
    """
    if not kwargs.get('created'):
        # Profile was updated
        pass