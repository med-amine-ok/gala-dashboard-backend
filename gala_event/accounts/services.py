import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import ActivationCode, CustomUser


class DuplicateEmail(Exception):
    """More than one account shares this email (case-insensitively)."""


def normalize_email(email):
    return (email or '').strip().lower()


def get_user_by_email(email):
    """Case-insensitive lookup. Returns None when missing, raises DuplicateEmail
    when legacy data holds two accounts that only differ by letter case."""
    users = list(CustomUser.objects.filter(email__iexact=normalize_email(email))[:2])
    if not users:
        return None
    if len(users) > 1:
        raise DuplicateEmail(email)
    return users[0]


def _hash(user, code):
    message = f"{user.pk}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()


RESEND_COOLDOWN = timedelta(seconds=60)


def issue_activation_code(user):
    """Create a fresh 6-digit code (older unused codes stop working).
    Returns (code, None) or (None, seconds_to_wait) when asked again too fast."""
    now = timezone.now()
    latest = user.activation_codes.filter(used_at__isnull=True).first()
    if latest and now - latest.created_at < RESEND_COOLDOWN:
        wait = int((RESEND_COOLDOWN - (now - latest.created_at)).total_seconds()) + 1
        return None, wait
    user.activation_codes.filter(used_at__isnull=True).update(used_at=now)
    code = f"{secrets.randbelow(10 ** 6):06d}"
    ActivationCode.objects.create(
        user=user,
        code_hash=_hash(user, code),
        expires_at=now + timedelta(minutes=settings.ACTIVATION_CODE_TTL_MINUTES),
    )
    return code, None


def check_activation_code(user, code):
    """Validate and consume the latest code. Returns an error message or None."""
    now = timezone.now()
    record = user.activation_codes.filter(used_at__isnull=True).first()
    if record is None or record.expires_at < now:
        return "This code has expired. Please request a new one."
    if record.attempts >= settings.ACTIVATION_CODE_MAX_ATTEMPTS:
        return "Too many wrong attempts. Please request a new code."
    if not hmac.compare_digest(record.code_hash, _hash(user, str(code).strip())):
        record.attempts += 1
        record.save(update_fields=['attempts'])
        return "Invalid code."
    record.used_at = now
    record.save(update_fields=['used_at'])
    return None
