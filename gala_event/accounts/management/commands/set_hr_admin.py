from django.core.management.base import BaseCommand, CommandError

from accounts.models import CustomUser
from accounts.services import DuplicateEmail, get_user_by_email


class Command(BaseCommand):
    help = (
        "Give an account the HR Admin role (dashboard access). Also detaches it from a "
        "company profile it was linked to by mistake (old company-creation code turned "
        "existing accounts into Company accounts)."
    )

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument('--dry-run', action='store_true', help='Only show what would change')

    def handle(self, email, dry_run=False, **options):
        try:
            user = get_user_by_email(email)
        except DuplicateEmail:
            raise CommandError(f"Several accounts use {email}; run find_duplicate_emails first.")
        if user is None:
            raise CommandError(f"No account with email {email}.")

        company = getattr(user, 'company_profile', None)
        self.stdout.write(f"Account #{user.id} {user.email}: role={user.get_role_display()}, "
                          f"active={user.is_active}, staff={user.is_staff}, superuser={user.is_superuser}")
        if company:
            self.stdout.write(f"  linked company profile: #{company.id} '{company.name}' (will be detached)")
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: nothing changed."))
            return

        user.role = CustomUser.Role.HR_ADMIN
        user.is_active = True
        user.is_staff = True
        user.save(update_fields=['role', 'is_active', 'is_staff'])
        if company:
            company.user = None
            company.save(update_fields=['user', 'updated_at'])
            self.stdout.write(f"  company '{company.name}' has no login account now; "
                              "re-create its login with a dedicated company email if it needs one.")
        self.stdout.write(self.style.SUCCESS(f"{user.email} is now an HR Admin. Log out and log in again."))
