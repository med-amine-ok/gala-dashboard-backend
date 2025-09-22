from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from participants.models import Participant
from accounts.models import CustomUser
from notifications.models import EmailLog, EmailTemplate
from .models import Ticket
import logging

logger = logging.getLogger(__name__)

def handle_payment_success(participant_id, payment_reference=None):
    """
    Handle successful payment for a participant:
    1. Update participant payment status
    2. Create a ticket if needed
    3. Ensure user account is active
    4. Send set password email if needed
    """
    try:
        participant = Participant.objects.get(id=participant_id)
        
        # Update payment status
        participant.payment_status = "paid"
        participant.save()
        
        # Create ticket if it doesn't exist
        if not hasattr(participant, 'ticket'):
            ticket = Ticket.objects.create(participant=participant)
            logger.info(f"Created ticket {ticket.serial_number} for participant {participant_id}")
        
        # Ensure user account exists and is active
        if participant.user:
            # Activate user if not already active
            if not participant.user.is_active:
                participant.user.is_active = True
                participant.user.save()
                
            # Send set password email
            send_set_password_email(participant.user)
            
            return {
                "success": True,
                "message": "Payment processed successfully. Set password email sent.",
                "participant_id": participant_id,
                "ticket_number": participant.ticket.serial_number if hasattr(participant, 'ticket') else None
            }
        else:
            logger.error(f"Participant {participant_id} has no associated user account")
            return {
                "success": False,
                "message": "Participant has no associated user account",
                "participant_id": participant_id
            }
            
    except Participant.DoesNotExist:
        logger.error(f"Participant with ID {participant_id} not found")
        return {
            "success": False,
            "message": f"Participant with ID {participant_id} not found"
        }
    except Exception as e:
        logger.error(f"Error processing payment success: {str(e)}")
        return {
            "success": False,
            "message": f"Error processing payment: {str(e)}"
        }

def send_set_password_email(user):
    """
    Send a set password email to the user
    """
    try:
        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Generate reset URL 
        reset_url = f"{settings.FRONTEND_URL}/set-password/{uid}/{token}/"
        
        # Try to get email template
        try:
            template = EmailTemplate.objects.get(template_type='payment_confirmation')
            subject = template.subject
            html_message = template.body_html.replace('{{reset_url}}', reset_url)
            plain_message = template.body_text.replace('{{reset_url}}', reset_url)
        except EmailTemplate.DoesNotExist:
            # Fallback to basic email
            subject = "Set Your Password - GALA Event"
            context = {
                'user': user,
                'reset_url': reset_url,
                'site_name': 'GALA Event'
            }
            html_message = render_to_string('emails/set_password.html', context)
            plain_message = render_to_string('emails/set_password.txt', context)
        
        # Send email
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False
        )
        
        # Log the email
        EmailLog.objects.create(
            recipient_email=user.email,
            recipient_name=f"{user.first_name} {user.last_name}",
            subject=subject,
            body_html=html_message,
            body_text=plain_message,
            status='sent',
            participant=user.participant_profile if hasattr(user, 'participant_profile') else None
        )
        
        return True
    except Exception as e:
        logger.error(f"Error sending set password email: {str(e)}")
        return False
