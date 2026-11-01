"""
All outgoing emails go through this module so that:
- every send is recorded in EmailLog (status sent/failed + error),
- bodies that contain secrets (activation codes) are
  never stored in the log,
- a failing SMTP server never turns an API call into a 500.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailLog, EmailTemplate

logger = logging.getLogger(__name__)

REDACTED_BODY = "[redacted: this email contained a one-time secret]"


def _fill(text, variables):
    """Replace {{name}} / {{ name }} placeholders with plain values."""
    if not text:
        return text
    for key, value in variables.items():
        text = text.replace('{{%s}}' % key, str(value)).replace('{{ %s }}' % key, str(value))
    return text


def _from_template(template_type, variables, subject, text, html=None):
    """Use the HR-editable EmailTemplate when one is active, else the built-in text."""
    template = EmailTemplate.objects.filter(template_type=template_type, is_active=True).first()
    if template:
        return (
            template,
            _fill(template.subject, variables),
            _fill(template.body_text, variables),
            _fill(template.body_html, variables) or None,
        )
    return None, subject, text, html


def send_email(*, to, subject, text, html=None, participant=None, template=None,
               sent_by=None, contains_secret=False):
    """Send one email and record it. Returns True when the SMTP send succeeded."""
    log = EmailLog(
        recipient_email=to,
        recipient_name=(participant.full_name if participant else '')[:100],
        subject=subject[:200],
        template_used=template,
        body_text=REDACTED_BODY if contains_secret else text,
        body_html=None if contains_secret else html,
        participant=participant,
        sent_by=sent_by,
    )
    try:
        send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [to], html_message=html, fail_silently=False)
        log.status = 'sent'
        log.sent_at = timezone.now()
        ok = True
    except Exception as exc:  # SMTP errors must not break the calling request
        logger.exception("Email to %s failed", to)
        log.status = 'failed'
        log.error_message = str(exc)[:2000]
        ok = False
    try:
        log.save()
    except Exception:
        logger.exception("Could not write EmailLog for %s", to)
    return ok


def _greeting(participant):
    name = (participant.first_name or (participant.user.first_name if participant.user else '') or '').strip()
    return f"Hello {name}," if name else "Hello,"


def payment_link(participant):
    return f"{settings.LANDING_URL}/payment/{participant.public_token}"


def send_activation_code(user, code):
    participant = getattr(user, 'participant_profile', None)
    minutes = settings.ACTIVATION_CODE_TTL_MINUTES
    subject = "Your Engineers' Gala activation code"
    text = (
        f"Hello {user.first_name or ''},\n\n"
        f"Your activation code is: {code}\n\n"
        f"Enter it in the Engineers' Gala app together with your new password. "
        f"It expires in {minutes} minutes.\n\n"
        "If you did not ask for this code, you can ignore this email: nobody can "
        "use your account without it.\n\n"
        "Engineers' Gala team"
    )
    return send_email(to=user.email, subject=subject, text=text, participant=participant, contains_secret=True)


def send_payment_confirmation_email(participant, ticket_serial=None, sent_by=None):
    """Sent when HR records a payment from the dashboard (the online flow on the
    landing site sends its own PDF ticket)."""
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    lines = [_greeting(participant), "", "We received your payment for the Engineers' Gala. Your seat is confirmed!", ""]
    if ticket_serial:
        lines += [f"Your ticket number: {ticket_serial}", ""]
    lines += [
        "To see your ticket and the programme, install the Engineers' Gala app and choose "
        "'Create account' with this email address. We will send you a one-time code to "
        "confirm it's you.", "",
        "See you at the Gala!",
        "Engineers' Gala team",
    ]
    variables = {'first_name': participant.first_name or '', 'ticket_serial': ticket_serial or ''}
    template, subject, text, html = _from_template(
        'payment_confirmation', variables,
        "Payment received - Engineers' Gala", "\n".join(lines),
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)


def send_approval_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    lines = [
        _greeting(participant), "",
        "Good news: your registration for the Engineers' Gala has been approved.", "",
    ]
    include_link = settings.PAYMENT_LINK_IN_APPROVAL_EMAIL and participant.payment_status != 'paid'
    if include_link:
        lines += [
            "To confirm your seat, please complete your payment here:",
            payment_link(participant), "",
            "Your ticket will be emailed to you as soon as the payment is received.", "",
        ]
    lines += [
        "You can also create your account in the Engineers' Gala app with this email address.", "",
        "See you at the Gala!",
        "Engineers' Gala team",
    ]
    variables = {
        'first_name': participant.first_name or '',
        'payment_url': payment_link(participant),
    }
    template, subject, text, html = _from_template(
        'approval_notification', variables,
        "Your Engineers' Gala registration is approved", "\n".join(lines),
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)


def send_rejection_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    text = "\n".join([
        _greeting(participant), "",
        "Thank you for your interest in the Engineers' Gala. Unfortunately we are "
        "not able to confirm your registration this time.", "",
        "Engineers' Gala team",
    ])
    variables = {'first_name': participant.first_name or '', 'rejection_reason': participant.rejection_reason}
    template, subject, text, html = _from_template(
        'rejection_notification', variables,
        "Your Engineers' Gala registration", text,
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)


def send_payment_link_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    text = "\n".join([
        _greeting(participant), "",
        "We're thrilled to have you joining us for the Engineers' Gala!", "",
        "To confirm your participation, please complete your payment at the link below:",
        payment_link(participant), "",
        "Once your payment is received, your place will be officially reserved and "
        "your ticket will be emailed to you.", "",
        "See you soon at the Engineers' Gala!",
    ])
    variables = {'first_name': participant.first_name or '', 'payment_url': payment_link(participant)}
    template, subject, text, html = _from_template(
        'payment_reminder', variables,
        "Secure your spot - Engineers' Gala payment link", text,
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)
