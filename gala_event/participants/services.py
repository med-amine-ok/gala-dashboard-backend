"""
Single place that changes a participant's review status.

Every endpoint that approves, rejects or resets a participant goes through
`set_status`, so the account activation and the notification email are always
consistent:

    PENDING  -> account inactive, no approver
    APPROVED -> account active, approver + date recorded, approval email
    REJECTED -> account inactive, reason required, rejection email
"""
from django.db import transaction
from django.utils import timezone

from .models import Participant

STATUS_ALIASES = {
    'approved': Participant.Status.APPROVED,
    'approve': Participant.Status.APPROVED,
    'rejected': Participant.Status.REJECTED,
    'reject': Participant.Status.REJECTED,
    'pending': Participant.Status.PENDING,
}


class StatusChangeError(ValueError):
    pass


def normalize_status(value):
    if value in Participant.Status.values:
        return value
    try:
        return STATUS_ALIASES[str(value).lower()]
    except KeyError:
        raise StatusChangeError(f"Unknown action '{value}'. Use approved, rejected or pending.")


def _apply(participant, new_status, by, reason, now):
    user = participant.user
    participant.status = new_status
    if new_status == Participant.Status.APPROVED:
        participant.approved_by = by
        participant.approved_at = now
        participant.rejection_reason = ''
        active = True
    elif new_status == Participant.Status.REJECTED:
        participant.approved_by = None
        participant.approved_at = None
        participant.rejection_reason = reason
        active = False
    else:
        participant.approved_by = None
        participant.approved_at = None
        participant.rejection_reason = ''
        active = False
    participant.save(update_fields=['status', 'approved_by', 'approved_at', 'rejection_reason', 'updated_at'])
    if user and user.is_active != active:
        user.is_active = active
        user.save(update_fields=['is_active'])


def _notify(participant_ids, new_status, by):
    # Imported here to avoid an import cycle (notifications -> participants)
    from notifications.emails import send_approval_email, send_rejection_email

    sender = {
        Participant.Status.APPROVED: send_approval_email,
        Participant.Status.REJECTED: send_rejection_email,
    }.get(new_status)
    if not sender:
        return
    for participant in Participant.objects.filter(id__in=participant_ids).select_related('user'):
        sender(participant, sent_by=by)


def set_status(participant_ids, action, by, reason='', notify=True):
    """Change the status of one or many participants atomically.

    Returns the list of participants whose status actually changed. Emails are
    only sent for those, and only once the transaction has committed.
    """
    new_status = normalize_status(action)
    reason = (reason or '').strip()
    if new_status == Participant.Status.REJECTED and not reason:
        raise StatusChangeError('Rejection reason is required when rejecting a participant.')

    now = timezone.now()
    changed = []
    with transaction.atomic():
        participants = (
            # of=('self',): Postgres can't lock the nullable side of the user join
            Participant.objects.select_for_update(of=('self',))
            .filter(id__in=participant_ids)
            .select_related('user')
        )
        for participant in participants:
            if participant.status == new_status:
                # Same status again: only a rejection reason may be corrected, silently
                if new_status == Participant.Status.REJECTED and participant.rejection_reason != reason:
                    participant.rejection_reason = reason
                    participant.save(update_fields=['rejection_reason', 'updated_at'])
                continue
            _apply(participant, new_status, by, reason, now)
            changed.append(participant)
        if notify and changed:
            ids = [p.id for p in changed]
            transaction.on_commit(lambda: _notify(ids, new_status, by))
    return changed
