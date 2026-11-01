"""
Recording a payment made outside the online checkout (cash, transfer...) from
the HR dashboard. The online Chargily flow lives in the landing site
(gala-landing/src/lib/payments/fulfill.ts) and follows the same rules:

- only APPROVED participants can be marked as paid,
- the payment never changes the review status,
- one ticket per participant; a free pre-generated ticket is reused first,
  picked with a row lock so two payments can never get the same ticket.
"""
import logging

from django.db import transaction
from django.utils import timezone

from participants.models import Participant
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


def _notify(participant_id, serial):
    from notifications.emails import send_payment_confirmation_email

    participant = Participant.objects.select_related('user').get(id=participant_id)
    send_payment_confirmation_email(participant, ticket_serial=serial)


def handle_payment_success(participant_id, payment_reference=None):
    """Mark an approved participant as paid and make sure they hold a ticket."""
    with transaction.atomic():
        participant = _lock_participant(participant_id)
        _mark_paid(participant)
        ticket = Ticket.objects.select_for_update().filter(participant=participant).first()
        if ticket is None:
            free = (
                Ticket.objects.select_for_update(skip_locked=True)
                .filter(participant__isnull=True)
                .exclude(status='cancelled')
                .order_by('created_at')
                .first()
            )
            ticket = _assign(free, participant) if free else Ticket.objects.create(
                participant=participant, status='assigned', assigned_at=timezone.now(),
            )
        serial = ticket.serial_number
        transaction.on_commit(lambda: _notify(participant.id, serial))

    logger.info("Payment recorded for participant %s (ref: %s), ticket %s", participant_id, payment_reference, serial)
    return {
        "success": True,
        "message": "Payment recorded. Confirmation email sent.",
        "participant_id": participant_id,
        "ticket_number": serial,
    }


def assign_ticket_with_payment(participant_id, ticket_serial):
    """Give a specific pre-generated ticket to an approved participant and mark them paid."""
    with transaction.atomic():
        participant = _lock_participant(participant_id)
        existing = Ticket.objects.filter(participant=participant).first()
        if existing:
            raise PaymentError(f"Participant already has ticket {existing.serial_number}")
        ticket = Ticket.objects.select_for_update().filter(serial_number=ticket_serial).first()
        if ticket is None:
            raise PaymentError(f"Ticket with serial number {ticket_serial} not found", 404)
        if ticket.participant_id is not None:
            raise PaymentError(f"Ticket {ticket_serial} is already assigned")
        if ticket.status == 'cancelled':
            raise PaymentError(f"Ticket {ticket_serial} is cancelled")
        _assign(ticket, participant)
        _mark_paid(participant)
        transaction.on_commit(lambda: _notify(participant.id, ticket.serial_number))
    return participant, ticket
