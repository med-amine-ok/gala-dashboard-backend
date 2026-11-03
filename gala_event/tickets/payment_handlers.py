"""
Everything that turns a payment into a ticket on the backend side.

Ways a participant ends up with a ticket:
- online Chargily payment, fulfilled by the landing site (webhook / success page),
  or recovered here by `sync_payment` (HR "Check payment" / "Sync payments"),
- HR records a cash/transfer payment (`handle_payment_success`),
- HR gives a specific pre-generated ticket (`assign_ticket_with_payment`).

Rules shared with the landing site (gala-landing/src/lib/payments/fulfill.ts):
- only APPROVED participants can be marked as paid / get a ticket,
- a payment never changes the review status,
- one ticket per participant; a free pre-generated ticket is reused first,
  picked with a row lock so two payments can never get the same ticket,
- every issued ticket is emailed, and `ticket.email_sent` records it.
"""
import logging

from django.db import transaction
from django.utils import timezone

from participants.models import Participant
from . import chargily
from .models import Ticket

logger = logging.getLogger(__name__)


class PaymentError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code


def _lock_participant(participant_id):
    participant = (
        Participant.objects.select_for_update(of=('self',))
        .select_related('user')
        .filter(id=participant_id)
        .first()
    )
    if participant is None:
        raise PaymentError(f"Participant with ID {participant_id} not found", 404)
    if participant.status != Participant.Status.APPROVED:
        raise PaymentError("Only approved participants can be marked as paid.")
    return participant


def _mark_paid(participant):
    participant.payment_status = 'paid'
    participant.save(update_fields=['payment_status', 'updated_at'])
    if participant.user and not participant.user.is_active:
        participant.user.is_active = True
        participant.user.save(update_fields=['is_active'])


def _assign(ticket, participant):
    ticket.participant = participant
    ticket.status = 'assigned'
    ticket.assigned_at = timezone.now()
    ticket.save(update_fields=['participant', 'status', 'assigned_at', 'updated_at'])
    return ticket


def _ensure_ticket(participant):
    """Return (ticket, created) for a locked participant."""
    ticket = Ticket.objects.select_for_update().filter(participant=participant).first()
    if ticket is not None:
        if ticket.status == 'active':
            ticket.status = 'assigned'
            ticket.assigned_at = ticket.assigned_at or timezone.now()
            ticket.save(update_fields=['status', 'assigned_at', 'updated_at'])
        return ticket, False
    free = (
        Ticket.objects.select_for_update(skip_locked=True)
        .filter(participant__isnull=True)
        .exclude(status='cancelled')
        .order_by('created_at')
        .first()
    )
    if free:
        return _assign(free, participant), True
    return Ticket.objects.create(participant=participant, status='assigned', assigned_at=timezone.now()), True


def email_ticket(participant_id, sent_by=None, force=False):
    """Send the ticket email (skipped when already sent, unless `force`).
    Returns True / False, or None when there was nothing to send."""
    from notifications.emails import send_ticket_email

    participant = Participant.objects.select_related('user').get(id=participant_id)
    ticket = Ticket.objects.filter(participant=participant).exclude(status='cancelled').first()
    if ticket is None:
        return None
    if ticket.email_sent and not force:
        return None
    return send_ticket_email(participant, ticket, sent_by=sent_by)


def handle_payment_success(participant_id, payment_reference=None, sent_by=None):
    """Mark an approved participant as paid, make sure they hold a ticket, email it."""
    with transaction.atomic():
        participant = _lock_participant(participant_id)
        _mark_paid(participant)
        ticket, _ = _ensure_ticket(participant)
        serial = ticket.serial_number

    email_sent = email_ticket(participant_id, sent_by=sent_by)
    logger.info("Payment recorded for participant %s (ref: %s), ticket %s, email_sent=%s",
                participant_id, payment_reference, serial, email_sent)
    return {
        "success": True,
        "message": "Payment recorded and ticket issued." + (
            " Ticket emailed." if email_sent else " The ticket email could not be sent." if email_sent is False else ""
        ),
        "participant_id": participant_id,
        "ticket_number": serial,
        "email_sent": bool(email_sent) or (email_sent is None),
    }


def assign_ticket_with_payment(participant_id, ticket_serial, sent_by=None):
    """Give a specific pre-generated ticket to an approved participant, mark them
    paid and email the ticket. Returns (participant, ticket, email_sent)."""
    with transaction.atomic():
        participant = _lock_participant(participant_id)
        existing = Ticket.objects.filter(participant=participant).first()
        if existing:
            raise PaymentError(f"Participant already has ticket {existing.serial_number}")
        ticket = Ticket.objects.select_for_update().filter(serial_number=ticket_serial.strip().upper()).first()
        if ticket is None:
            raise PaymentError(f"Ticket with serial number {ticket_serial} not found", 404)
        if ticket.participant_id is not None:
            raise PaymentError(f"Ticket {ticket_serial} is already assigned")
        if ticket.status == 'cancelled':
            raise PaymentError(f"Ticket {ticket_serial} is cancelled")
        _assign(ticket, participant)
        _mark_paid(participant)

    email_sent = bool(email_ticket(participant.id, sent_by=sent_by, force=True))
    ticket.refresh_from_db()
    return participant, ticket, email_sent


def sync_payment(participant, index=None, sent_by=None):
    """Bring one participant's payment / ticket / email up to date.

    Returns a dict with `result` in:
      ticket_issued    paid (confirmed by Chargily or already marked) -> ticket given + emailed
      email_resent     already had a ticket that was never emailed -> emailed now
      up_to_date       paid, ticket and email all fine
      not_paid         Chargily has no paid checkout for this participant
      needs_review     Chargily says paid but the participant is not approved
      error            Chargily unreachable / not configured
    """
    base = {'id': participant.id, 'name': participant.full_name}
    has_ticket = Ticket.objects.filter(participant=participant).exclude(status='cancelled').exists()

    if participant.payment_status == 'paid' and has_ticket:
        sent = email_ticket(participant.id, sent_by=sent_by)
        if sent is None:
            return {**base, 'result': 'up_to_date'}
        return {**base, 'result': 'email_resent' if sent else 'email_failed', 'email_sent': bool(sent)}

    checkout = None
    if participant.payment_status != 'paid':
        try:
            checkout = (index or chargily.CheckoutIndex()).paid_checkout(participant.id)
        except chargily.ChargilyError as exc:
            return {**base, 'result': 'error', 'detail': str(exc)}
        if checkout is None:
            return {**base, 'result': 'not_paid'}

    if participant.status != Participant.Status.APPROVED:
        if checkout:
            Participant.objects.filter(id=participant.id).update(payment_status='paid', updated_at=timezone.now())
            chargily.mark_payment_row_succeeded(participant.id, checkout)
        return {**base, 'result': 'needs_review',
                'detail': 'Paid on Chargily but not approved: approve (then sync again) or refund.'}

    if checkout:
        chargily.mark_payment_row_succeeded(participant.id, checkout)
    result = handle_payment_success(
        participant.id, payment_reference=(checkout or {}).get('id') or 'already marked paid', sent_by=sent_by,
    )
    return {**base, 'result': 'ticket_issued', 'ticket_number': result['ticket_number'],
            'email_sent': result['email_sent']}
