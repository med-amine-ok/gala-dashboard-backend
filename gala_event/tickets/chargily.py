"""
Minimal Chargily Pay v2 client used by the HR "check payment" / "sync payments"
actions. The online checkout itself is created by the landing site, which also
stores the checkout id in the `payments` table (shared database, not a Django
model). Asking Chargily directly makes ticket issuing independent of the
webhook and of the payer coming back to the success page.
"""
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings
from django.db import connection
from django.utils import timezone

logger = logging.getLogger(__name__)


class ChargilyError(Exception):
    pass


def is_configured():
    return bool(settings.CHARGILY_API_KEY)


def _base_url():
    if settings.CHARGILY_API_URL:
        return settings.CHARGILY_API_URL.rstrip('/')
    if settings.CHARGILY_API_KEY.startswith('test_'):
        return 'https://pay.chargily.net/test/api/v2'
    return 'https://pay.chargily.net/api/v2'


def _get(path):
    if not is_configured():
        raise ChargilyError("CHARGILY_API_KEY is not configured on the backend.")
    request = urllib.request.Request(
        f"{_base_url()}{path}",
        headers={
            'Authorization': f"Bearer {settings.CHARGILY_API_KEY}",
            'Accept': 'application/json',
            # Chargily is behind Cloudflare, which rejects Python's default
            # "Python-urllib" user agent with HTTP 403 (error 1010)
            'User-Agent': 'gala-backend/1.0 (+https://gala.vic-enp.com)',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise ChargilyError(f"Chargily returned HTTP {exc.code} for {path}") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise ChargilyError(f"Could not reach Chargily: {exc}") from exc


def _payments_table_exists():
    return 'payments' in connection.introspection.table_names()


def stored_payment(participant_id):
    """(status, chargily_checkout_id) of the landing site's payment row, or None."""
    if not _payments_table_exists():
        return None
    with connection.cursor() as cursor:
        columns = {c.name for c in connection.introspection.get_table_description(cursor, 'payments')}
        checkout_col = 'chargily_checkout_id' if 'chargily_checkout_id' in columns else 'NULL'
        cursor.execute(
            f'SELECT status, {checkout_col} FROM payments WHERE participant_id = %s',
            [participant_id],
        )
        row = cursor.fetchone()
    return row


def mark_payment_row_succeeded(participant_id, checkout):
    """Keep the landing site's `payments` row in line with what Chargily says."""
    if not _payments_table_exists():
        return
    now = timezone.now()
    with connection.cursor() as cursor:
        columns = {c.name for c in connection.introspection.get_table_description(cursor, 'payments')}
        if 'chargily_checkout_id' in columns:
            cursor.execute(
                "UPDATE payments SET status = 'succeeded', chargily_checkout_id = %s, updated_at = %s "
                "WHERE participant_id = %s",
                [checkout.get('id'), now, participant_id],
            )
        else:
            cursor.execute(
                "UPDATE payments SET status = 'succeeded', updated_at = %s WHERE participant_id = %s",
                [now, participant_id],
            )


def _is_paid_for(checkout, participant_id):
    metadata = checkout.get('metadata') or {}
    return checkout.get('status') == 'paid' and str(metadata.get('participantId')) == str(participant_id)


class CheckoutIndex:
    """Looks checkouts up for many participants with as few API calls as possible:
    stored checkout ids are fetched directly, the full list is scanned once."""

    def __init__(self, max_pages=40):
        self.max_pages = max_pages
        self._paid_by_participant = None

    def _scan(self):
        if self._paid_by_participant is not None:
            return
        self._paid_by_participant = {}
        page = 1
        while page <= self.max_pages:
            data = _get(f"/checkouts?per_page=50&page={page}") or {}
            for checkout in data.get('data') or []:
                metadata = checkout.get('metadata') or {}
                pid = str(metadata.get('participantId') or '')
                if pid and checkout.get('status') == 'paid':
                    self._paid_by_participant.setdefault(pid, checkout)
            last_page = data.get('last_page') or 1
            if page >= last_page:
                break
            page += 1

    def paid_checkout(self, participant_id):
        payment = stored_payment(participant_id)
        checkout_id = payment[1] if payment else None
        if checkout_id:
            checkout = _get(f"/checkouts/{checkout_id}")
            if checkout and _is_paid_for(checkout, participant_id):
                return checkout
        self._scan()
        return self._paid_by_participant.get(str(participant_id))
