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
import re
import urllib.parse
from email.mime.image import MIMEImage

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from .email_layout import EVENT, esc, render_email, site_url
from .models import EmailLog, EmailTemplate
from .ticket_template import TICKET_TEMPLATE

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
               sent_by=None, contains_secret=False, attachments=None, inline_images=None):
    """Send one email and record it. Returns True when the SMTP send succeeded.
    `attachments` is a list of (filename, bytes, mimetype); `inline_images` a
    list of (content_id, png bytes), shown inside the HTML as <img src="cid:...">."""
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
        if inline_images:
            # multipart/related: the images belong to the HTML, they are not attachments
            message.mixed_subtype = 'related'
            for cid, content in inline_images:
                image = MIMEImage(content, 'png')
                image.add_header('Content-ID', f'<{cid}>')
                image.add_header('Content-Disposition', 'inline', filename=f'{cid}.png')
                message.attach(image)
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
    """The printable PDF ticket (generated by the landing site), for whoever wants one."""
    return f"{settings.LANDING_URL}/api/tickets/download?token={urllib.parse.quote(participant.public_token)}"


def ticket_qr_payload(participant, ticket):
    """Same JSON as the landing site's ticket, so the check-in scanner reads both."""
    return json.dumps({
        'lastName': participant.last_name or '',
        'firstName': participant.first_name or '',
        'serialNumber': ticket.serial_number,
        'email': participant.email or '',
    })


TICKET_QR_CID = 'gala-ticket-qr'


def _ticket_qr_png(participant, ticket):
    """The QR code as a PNG: plum on white, with a quiet zone (scanners need it)."""
    import qrcode

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=2)
    qr.add_data(ticket_qr_payload(participant, ticket))
    qr.make(fit=True)
    buffer = io.BytesIO()
    qr.make_image(fill_color='#2E061E', back_color='#FFFFFF').save(buffer, format='PNG')
    return buffer.getvalue()


def calendar_url():
    """Google Calendar link for the evening (all-day, since no time is announced yet)."""
    from datetime import date, timedelta

    day = date.fromisoformat(EVENT['iso_date'])
    dates = f"{day:%Y%m%d}/{day + timedelta(days=1):%Y%m%d}"
    return 'https://calendar.google.com/calendar/render?' + urllib.parse.urlencode({
        'action': 'TEMPLATE',
        'text': EVENT['name'],
        'dates': dates,
        'location': f"{EVENT['venue_name']}, {EVENT['venue_city']}",
        'details': f"Your admission pass is in your ticket email. Directions: {EVENT['map_url']}",
    })


def fill_ticket_template(values):
    """Fill the {{placeholders}} of the shared ticket template; every value is HTML-escaped."""
    body = TICKET_TEMPLATE.replace('<!--TICKET-TEMPLATE-START-->\n', '').replace('\n<!--TICKET-TEMPLATE-END-->', '')

    def value(match):
        key = match.group(1)
        if key not in values:
            raise KeyError(f'Ticket template: no value for {key}')
        return esc(values[key])

    return re.sub(r'\{\{(\w+)\}\}', value, body)


def render_ticket_email(participant, ticket):
    """(subject, text, html): the email is the admission pass itself (guest,
    date, venue with a map link, and the QR code embedded as cid:gala-ticket-qr)."""
    first = _first_name(participant)
    guest = f"{participant.first_name or ''} {participant.last_name or ''}".strip() or (participant.email or '')
    site = site_url()
    app_tip = ("Tip: in the Engineers' Gala app, choose 'Create account' with this email "
               "address to keep your pass and the programme at hand.")
    greeting = f"Dear {first}," if first else "Hello,"
    html = fill_ticket_template({
        'preheader': f"Your seat is confirmed. Pass {ticket.serial_number} · {EVENT['date_long']} · {EVENT['venue_name']}",
        'pattern_url': f"{site}/email/plum-pattern.jpg",
        'logo_url': f"{site}/GALA-silver.png",
        'greeting': greeting,
        'event_name': EVENT['name'],
        'serial': ticket.serial_number,
        'guest_name': guest,
        'date': EVENT['date_long'],
        'venue_name': EVENT['venue_name'],
        'venue_city': EVENT['venue_city'],
        'map_url': EVENT['map_url'],
        'calendar_url': calendar_url(),
        'price': EVENT['price'],
        'qr_src': f"cid:{TICKET_QR_CID}",
        'app_tip': app_tip,
        'organiser': EVENT['organiser'],
        'site_url': site,
        'site_label': site.split('://', 1)[-1],
    })
    text = '\n'.join([
        'PAYMENT CONFIRMED',
        'Your admission pass',
        '',
        f"{greeting} your seat is confirmed. This email is your ticket: show its QR code at the entrance.",
        '',
        f"Guest: {guest}",
        f"Pass number: {ticket.serial_number}",
        f"Date: {EVENT['date_long']}",
        f"Venue: {EVENT['venue_name']}, {EVENT['venue_city']} ({EVENT['map_url']})",
        'Admits: one guest',
        f"Entrance: {EVENT['price']} (paid)",
        '',
        "Keep this email until the evening and don't share the QR code: it opens the door only once.",
        app_tip,
        '',
        f"— {EVENT['name']}",
        EVENT['organiser'],
        site,
    ])
    return f"Your admission pass · {EVENT['name']}", text, html


def send_ticket_email(participant, ticket, sent_by=None):
    """Email the participant their ticket and mark it as emailed. The email is
    the admission pass itself (no PDF attached), with the QR code embedded.
    Used for every way a ticket can be issued: online payment sync, manual
    payment, manual assignment, resend."""
    email = participant.email or (participant.user.email if participant.user else None)
    if not email:
        return False

    subject, text, html = render_ticket_email(participant, ticket)
    ok = send_email(to=email, subject=subject, text=text, html=html, participant=participant,
                    sent_by=sent_by, inline_images=[(TICKET_QR_CID, _ticket_qr_png(participant, ticket))])
    if ok:
        ticket.email_sent = True
        ticket.email_sent_at = timezone.now()
        ticket.save(update_fields=['email_sent', 'email_sent_at', 'updated_at'])
    return ok


def _payment_link_content(participant, intro):
    return dict(
        preheader=f"Approved! Pay {EVENT['price']} within 48 hours, online or at the VIC office, to confirm your seat.",
        eyebrow="Registration approved",
        title="Your seat is waiting",
        greeting=_greeting(participant),
        paragraphs=[
            intro,
            f"To confirm your seat, please pay the entrance fee of {EVENT['price']} within 48 hours, "
            "in one of two ways:",
            "• Online: with the secure button below (Edahabia or CIB card).",
            f"• In person: at the VIC office ({EVENT['organiser']}).",
            "As soon as your payment is received, your official ticket will be emailed to you.",
        ],
        cta={'label': f"Pay {EVENT['price']} online", 'url': payment_link(participant)},
        details=[
            ('Date', EVENT['date_long']),
            ('Venue', 'To be announced, stay tuned'),
            ('Entrance', EVENT['price']),
            ('Pay within', '48 hours'),
        ],
        footnote="This link is personal: please don't share it. Online payments are processed securely by "
                 "Chargily Pay.",
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
            details=[('Date', EVENT['date_long']), ('Venue', EVENT['venue'], EVENT['map_url'])],
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
