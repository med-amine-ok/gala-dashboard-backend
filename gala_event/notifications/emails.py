"""
All outgoing emails go through this module so that:
- every send is recorded in EmailLog (status sent/failed + error),
- bodies that contain secrets (activation codes) are
  never stored in the log,
- a failing SMTP server never turns an API call into a 500.
"""
import io
import json
import logging
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from .email_layout import EVENT, render_email
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
               sent_by=None, contains_secret=False, attachments=None):
    """Send one email and record it. Returns True when the SMTP send succeeded.
    `attachments` is a list of (filename, bytes, mimetype)."""
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
        message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [to])
        if html:
            message.attach_alternative(html, 'text/html')
        for filename, content, mimetype in attachments or []:
            message.attach(filename, content, mimetype)
        message.send(fail_silently=False)
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


def _first_name(participant):
    return (participant.first_name or (participant.user.first_name if participant.user else '') or '').strip()


def _greeting(participant):
    name = _first_name(participant)
    return f"Dear {name}," if name else "Hello,"


def _branded(template_type, variables, subject, **content):
    """Branded default email, unless HR created an active EmailTemplate of this type."""
    html, text = render_email(**content)
    return _from_template(template_type, variables, subject, text, html)


def payment_link(participant):
    return f"{settings.LANDING_URL}/payment/{participant.public_token}"


def send_activation_code(user, code):
    participant = getattr(user, 'participant_profile', None)
    minutes = settings.ACTIVATION_CODE_TTL_MINUTES
    name = (user.first_name or '').strip()
    html, text = render_email(
        preheader=f"Your activation code: {code} (valid {minutes} minutes)",
        eyebrow="Account activation",
        title="Your activation code",
        greeting=f"Dear {name}," if name else "Hello,",
        paragraphs=[
            f"Enter this code in the {EVENT['name']} app, together with your new password, "
            "to create your account.",
        ],
        highlight={'label': f"Valid for {minutes} minutes", 'value': code, 'monospace': True, 'large': True},
        footnote="Didn't ask for this code? You can safely ignore this email: nobody can use your account without it.",
    )
    return send_email(to=user.email, subject=f"{code} is your Engineers' Gala activation code",
                      text=text, html=html, participant=participant, contains_secret=True)


def ticket_download_link(participant):
    return f"{settings.LANDING_URL}/api/tickets/download?token={urllib.parse.quote(participant.public_token)}"


def ticket_qr_payload(participant, ticket):
    """Same JSON as the landing site's PDF ticket, so the check-in scanner reads both."""
    return json.dumps({
        'lastName': participant.last_name or '',
        'firstName': participant.first_name or '',
        'serialNumber': ticket.serial_number,
        'email': participant.email or '',
    })


def _ticket_pdf(participant):
    """The official PDF ticket is generated by the landing site (it owns the
    template). Returns the bytes, or None if the landing site can't be reached."""
    try:
        request = urllib.request.Request(ticket_download_link(participant), headers={'User-Agent': 'gala-backend'})
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status == 200 and 'pdf' in response.headers.get('Content-Type', ''):
                return response.read()
    except Exception:
        logger.warning("Could not fetch the PDF ticket for participant %s", participant.id, exc_info=True)
    return None


def _ticket_qr_png(participant, ticket):
    import qrcode

    buffer = io.BytesIO()
    qrcode.make(ticket_qr_payload(participant, ticket), box_size=10, border=2).save(buffer, format='PNG')
    return buffer.getvalue()


def send_ticket_email(participant, ticket, sent_by=None):
    """Email the participant their ticket (PDF from the landing site when it can
    be generated, always a QR code image as well) and mark it as emailed.
    Used for every way a ticket can be issued: online payment sync, manual
    payment, manual assignment, resend."""
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False

    attachments = []
    pdf = _ticket_pdf(participant)
    if pdf:
        attachments.append((f"ticket-{ticket.serial_number}.pdf", pdf, 'application/pdf'))
    attachments.append((f"ticket-{ticket.serial_number}-qr.png", _ticket_qr_png(participant, ticket), 'image/png'))

    paragraphs = [
        "Thank you, your payment has been received and your seat is officially confirmed.",
        "Your personal ticket is attached to this email. Show its QR code at the entrance, "
        "printed or on your phone.",
    ]
    if not pdf:
        paragraphs.append("The PDF version of your ticket can be downloaded with the button below.")
    paragraphs.append(f"Tip: in the {EVENT['name']} app, choose 'Create account' with this email "
                      "address to keep your ticket and the programme at hand.")
    variables = {
        'first_name': _first_name(participant),
        'ticket_serial': ticket.serial_number,
        'ticket_url': ticket_download_link(participant),
    }
    template, subject, text, html = _branded(
        'payment_confirmation', variables, f"Your ticket for the {EVENT['name']}",
        preheader=f"Payment received. Your ticket {ticket.serial_number} is attached.",
        eyebrow="Payment confirmed",
        title="Your ticket is ready",
        greeting=_greeting(participant),
        paragraphs=paragraphs,
        highlight={'label': 'Ticket number', 'value': ticket.serial_number, 'monospace': True},
        cta=None if pdf else {'label': 'Download my ticket', 'url': ticket_download_link(participant)},
        details=[('Date', EVENT['date']), ('Venue', EVENT['venue'])],
        footnote="Each ticket admits one person and can be scanned only once. Keep it to yourself until the event.",
    )
    ok = send_email(to=email, subject=subject, text=text, html=html, participant=participant,
                    template=template, sent_by=sent_by, attachments=attachments)
    if ok:
        ticket.email_sent = True
        ticket.email_sent_at = timezone.now()
        ticket.save(update_fields=['email_sent', 'email_sent_at', 'updated_at'])
    return ok


def _payment_link_content(participant, intro):
    return dict(
        preheader=f"Your registration is approved. Confirm your seat with a {EVENT['price']} payment.",
        eyebrow="Registration approved",
        title="Your seat is waiting",
        greeting=_greeting(participant),
        paragraphs=[
            intro,
            f"To confirm your seat, complete your payment of {EVENT['price']} using the secure link "
            "below. As soon as it is received, your official ticket will be emailed to you.",
        ],
        cta={'label': f"Pay {EVENT['price']} & confirm my seat", 'url': payment_link(participant)},
        details=[('Date', EVENT['date']), ('Venue', EVENT['venue']), ('Entrance', EVENT['price'])],
        footnote="This link is personal: please don't share it. Payments are processed securely by "
                 "Chargily Pay (Edahabia / CIB).",
    )


def send_approval_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    variables = {'first_name': _first_name(participant), 'payment_url': payment_link(participant)}
    intro = f"Good news: our committee has approved your registration for the {EVENT['name']}."
    if settings.PAYMENT_LINK_IN_APPROVAL_EMAIL and participant.payment_status != 'paid':
        content = _payment_link_content(participant, intro)
    else:
        content = dict(
            preheader=f"Your registration for the {EVENT['name']} is approved.",
            eyebrow="Registration approved",
            title="Welcome to the Gala",
            greeting=_greeting(participant),
            paragraphs=[intro, "We can't wait to welcome you. Your ticket details will follow by email."],
            details=[('Date', EVENT['date']), ('Venue', EVENT['venue'])],
        )
    template, subject, text, html = _branded(
        'approval_notification', variables, f"You're approved for the {EVENT['name']}", **content)
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)


def send_rejection_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    variables = {'first_name': _first_name(participant), 'rejection_reason': participant.rejection_reason}
    template, subject, text, html = _branded(
        'rejection_notification', variables, f"About your {EVENT['name']} registration",
        preheader=f"An update about your registration for the {EVENT['name']}.",
        eyebrow="Registration update",
        title="Thank you for your interest",
        greeting=_greeting(participant),
        paragraphs=[
            f"Thank you for applying to the {EVENT['name']}. We received many more requests than "
            "we have seats, and unfortunately we are not able to confirm your registration this time.",
            "We truly appreciate your interest and hope to welcome you at a future edition.",
        ],
        footnote="Questions? Simply reply to this email.",
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)


def send_payment_link_email(participant, sent_by=None):
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False
    variables = {'first_name': _first_name(participant), 'payment_url': payment_link(participant)}
    template, subject, text, html = _branded(
        'payment_reminder', variables, f"Your seat at the {EVENT['name']} is waiting",
        **_payment_link_content(participant, f"Your registration for the {EVENT['name']} has been approved."),
    )
    return send_email(to=email, subject=subject, text=text, html=html,
                      participant=participant, template=template, sent_by=sent_by)
