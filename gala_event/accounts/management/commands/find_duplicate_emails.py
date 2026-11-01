from django.core.management.base import BaseCommand
from django.db.models import Count
from django.db.models.functions import Lower

from accounts.models import CustomUser


class Command(BaseCommand):
    help = "List accounts whose emails only differ by letter case (they can't log in until merged)."

    def handle(self, *args, **options):
        duplicates = (
            CustomUser.objects.annotate(email_lower=Lower('email'))
            .values('email_lower').annotate(n=Count('id')).filter(n__gt=1)
        )
        if not duplicates:
            self.stdout.write(self.style.SUCCESS("No case-insensitive duplicate emails."))
            return
        for row in duplicates:
            users = CustomUser.objects.filter(email__iexact=row['email_lower']).order_by('date_joined')
            self.stdout.write(self.style.WARNING(f"{row['email_lower']}:"))
            for user in users:
                profile = getattr(user, 'participant_profile', None)
                self.stdout.write(
                    f"  user #{user.id} {user.email} role={user.role} active={user.is_active} "
                    f"joined={user.date_joined:%Y-%m-%d} participant={profile.id if profile else '-'} "
                    f"status={profile.status if profile else '-'}"
                )
        self.stdout.write("Keep one account per email and delete the others from the dashboard or Django admin.")
