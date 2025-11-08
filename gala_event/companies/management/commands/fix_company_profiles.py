from django.core.management.base import BaseCommand
from companies.models import Company
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Fix company profiles by ensuring proper relationships between users and companies'

    def handle(self, *args, **options):
        # Find all companies
        companies = Company.objects.all()
        fixed = 0
        errors = []

        for company in companies:
            try:
                # Check if company has a user
                if not company.user:
                    # Try to find a user with matching email
                    try:
                        user = CustomUser.objects.get(email__iexact=company.email)
                        company.user = user
                        company.save()
                        # Ensure user has COMPANY role
                        if user.role != CustomUser.Role.COMPANY:
                            user.role = CustomUser.Role.COMPANY
                            user.save()
                        fixed += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'Fixed relationship for company {company.name}'
                        ))
                    except CustomUser.DoesNotExist:
                        errors.append(f'No user found for company {company.name} with email {company.email}')
                        continue
                else:
                    # Ensure user has COMPANY role
                    user = company.user
                    if user.role != CustomUser.Role.COMPANY:
                        user.role = CustomUser.Role.COMPANY
                        user.save()
                        fixed += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'Fixed role for company user {user.email}'
                        ))
            except Exception as e:
                errors.append(f'Error fixing company {company.name}: {str(e)}')

        # Print summary
        self.stdout.write('\nSummary:')
        self.stdout.write(self.style.SUCCESS(f'Fixed {fixed} company profiles'))
        if errors:
            self.stdout.write(self.style.ERROR('\nErrors:'))
            for error in errors:
                self.stdout.write(self.style.ERROR(error))