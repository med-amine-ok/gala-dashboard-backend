import logging
import uuid
from datetime import timedelta

from cloudinary.uploader import upload as cloudinary_upload
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsHRAdmin, IsParticipant
from notifications.emails import payment_link, send_payment_link_email
from tickets.chargily import CheckoutIndex
from tickets.payment_handlers import sync_payment
from .models import Participant, ParticipantImage, ParticipantParticipantLink
from .serializers import (
    FeedbackSerializer,
    ParticipantApprovalSerializer,
    ParticipantBulkApprovalSerializer,
    ParticipantIdsSerializer,
    ParticipantImageSerializer,
    ParticipantRegistrationSerializer,
    ParticipantSelfUpdateSerializer,
    ParticipantSerializer,
    ParticipantWithTicketSerializer,
)
from .services import StatusChangeError, set_status

logger = logging.getLogger(__name__)

# Participants handled per "Sync payments" call: each one may mean a Chargily
# call, a PDF download and an email, and the server has a request time limit.
SYNC_BATCH = 5
SYNC_MESSAGES = {
    'ticket_issued': 'Payment confirmed: ticket issued and emailed.',
    'email_resent': 'Ticket email sent (it had never been delivered).',
    'email_failed': 'Paid and ticket issued, but the email could not be sent.',
    'up_to_date': 'Already paid, ticket issued and emailed.',
    'not_paid': 'No completed payment found on Chargily for this participant.',
    'needs_review': 'Paid on Chargily but not approved: approve them, then check again (or refund).',
    'error': 'Could not check with Chargily.',
}


def _own_profile(request):
    """The participant profile of the logged-in user, or None."""
    return getattr(request.user, 'participant_profile', None)


class ParticipantProfileView(APIView):
    """A participant's own profile, with their ticket."""
    permission_classes = [IsParticipant]

    def get(self, request):
        participant = _own_profile(request)
        if participant is None:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

        response_data = dict(ParticipantSerializer(participant).data)
        ticket = getattr(participant, 'ticket', None) if hasattr(participant, 'ticket') else None
        response_data['ticket'] = {
            'serial_number': ticket.serial_number,
            'status': ticket.status,
            'issued_at': ticket.issued_at,
        } if ticket else None
        return Response(response_data, status=status.HTTP_200_OK)


class ParticipantProfileUpdateView(APIView):
    """Participants may only edit harmless fields (see ParticipantSelfUpdateSerializer)."""
    permission_classes = [IsParticipant]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request):
        participant = _own_profile(request)
        if participant is None:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ParticipantSelfUpdateSerializer(participant, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(ParticipantSerializer(participant).data, status=status.HTTP_200_OK)

    def patch(self, request):
        return self.put(request)


class ParticipantRegistrationView(APIView):
    # Public endpoint, no authentication required
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    throttle_scope = 'register'

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register a new participant (public)",
        operation_description="Creates an inactive user account (username=email) and a PENDING participant profile."
    )
    def post(self, request):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                participant = serializer.save()
        except IntegrityError:
            # Two submissions with the same email at the same moment
            return Response({"email": ["This email is already registered."]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Registration failed")
            return Response(
                {"error": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({
            "message": "Thank you for registering! Your account has been created successfully.",
            "next_steps": [
                "Your registration is pending admin approval",
                "You will receive an email once it is reviewed",
                "After approval, pay your seat with the link in that email, then create your account in the app",
            ],
            "status": "PENDING",
            "email": participant.email,
        }, status=status.HTTP_201_CREATED)


class ParticipantPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 1000


class ParticipantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    HR-only: list/read participants, delete, and approve / reject.
    """
    queryset = Participant.objects.all().select_related('user', 'ticket', 'approved_by')
    serializer_class = ParticipantWithTicketSerializer
    permission_classes = [IsHRAdmin]
    pagination_class = ParticipantPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'status', 'payment_status', 'participant_type',
        'university', 'field_of_study', 'academic_level', 'graduation_year'
    ]
    search_fields = [
        'first_name', 'last_name', 'email', 'phone',
        'user__first_name', 'user__last_name', 'user__email',
        'university', 'university_other', 'field_of_study',
    ]
    ordering_fields = ['registered_at', 'status', 'last_name', 'payment_status']
    ordering = ['-registered_at']

    def get_serializer_class(self):
        if self.action == 'approve_reject':
            return ParticipantApprovalSerializer
        return ParticipantWithTicketSerializer

    def destroy(self, request, *args, **kwargs):
        """Delete a participant and the user account behind it"""
        instance = self.get_object()
        with transaction.atomic():
            user = instance.user
            instance.delete()
            if user:
                user.delete()
        return Response({"message": "Participant and associated user deleted successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def approve_reject(self, request, pk=None):
        """Approve, reject, or reset a participant to pending"""
        participant = self.get_object()
        serializer = ParticipantApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            set_status(
                [participant.id],
                serializer.validated_data['action'],
                by=request.user,
                reason=serializer.validated_data.get('rejection_reason', ''),
            )
        except StatusChangeError as exc:
            return Response({"rejection_reason": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        participant.refresh_from_db()
        return Response({
            "message": f"Participant status set to {participant.get_status_display().lower()}",
            "participant_id": participant.id,
            "new_status": participant.status,
            "participant_name": participant.full_name or "Unknown",
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        request_body=ParticipantBulkApprovalSerializer,
        responses={
            200: openapi.Response(description="Successful bulk status update"),
            400: openapi.Response(description="Validation error or unknown ids (missing_ids)"),
        },
    )
    @action(detail=False, methods=['post'])
    def bulk_approve_reject(self, request):
        """Bulk approve / reject / reset participants"""
        serializer = ParticipantBulkApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        participant_ids = serializer.validated_data['participant_ids']

        found_ids = set(Participant.objects.filter(id__in=participant_ids).values_list('id', flat=True))
        missing_ids = [pid for pid in participant_ids if pid not in found_ids]
        if missing_ids:
            return Response({
                "error": "Some participant IDs were not found.",
                "missing_ids": missing_ids
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            changed = set_status(
                participant_ids,
                serializer.validated_data['action'],
                by=request.user,
                reason=serializer.validated_data.get('rejection_reason', ''),
            )
        except StatusChangeError as exc:
            return Response({"rejection_reason": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": f"Bulk {serializer.validated_data['action']} operation completed successfully",
            "affected_count": len(changed),
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(method='post', request_body=ParticipantIdsSerializer)
    @action(detail=False, methods=['post'])
    def send_payment_links(self, request):
        """Email the payment link to approved participants who have not paid yet"""
        serializer = ParticipantIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        participants = Participant.objects.filter(
            id__in=serializer.validated_data['participant_ids'],
        ).select_related('user')
        sent, skipped = [], []
        for participant in participants:
            if participant.status != Participant.Status.APPROVED or participant.payment_status == 'paid':
                skipped.append({'id': participant.id, 'reason': 'not approved or already paid'})
                continue
            if send_payment_link_email(participant, sent_by=request.user):
                sent.append(participant.id)
            else:
                skipped.append({'id': participant.id, 'reason': 'email failed'})
        message = f"Payment link sent to {len(sent)} participant(s)."
        if skipped:
            message += f" {len(skipped)} skipped (not approved, already paid or email failed)."
        return Response({'message': message, 'sent': sent, 'skipped': skipped}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def send_payment_link(self, request, pk=None):
        """Email the payment link to one approved, unpaid participant.
        The link is also returned so HR can share it another way if needed."""
        participant = self.get_object()
        if participant.status != Participant.Status.APPROVED:
            return Response({'error': 'Approve the participant first.'}, status=status.HTTP_400_BAD_REQUEST)
        if participant.payment_status == 'paid':
            return Response({'error': 'This participant has already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        sent = send_payment_link_email(participant, sent_by=request.user)
        body = {'email_sent': sent, 'payment_url': payment_link(participant), 'email': participant.email}
        if not sent:
            return Response({**body, 'error': 'The email could not be sent. Check the email settings (see email logs). '
                                              'You can copy the payment link instead.'},
                            status=status.HTTP_502_BAD_GATEWAY)
        return Response({**body, 'message': f'Payment link sent to {participant.email}.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def sync_payment(self, request, pk=None):
        """Ask Chargily whether this participant paid; if so issue + email the ticket.
        Also re-sends a ticket email that never went out."""
        participant = self.get_object()
        result = sync_payment(participant, sent_by=request.user)
        result['message'] = SYNC_MESSAGES.get(result['result'], result['result'])
        code = status.HTTP_502_BAD_GATEWAY if result['result'] == 'error' else status.HTTP_200_OK
        return Response(result, status=code)

    @action(detail=False, methods=['post'])
    def sync_payments(self, request):
        """Batch version of sync_payment over approved participants that are not
        fully done (unpaid, paid without ticket, or ticket never emailed).
        Processes SYNC_BATCH participants per call; call again with
        `after_id` = `next_after_id` until it is null."""
        try:
            after_id = int(request.data.get('after_id') or 0)
        except (TypeError, ValueError):
            after_id = 0
        candidates = (
            Participant.objects.filter(status=Participant.Status.APPROVED, id__gt=after_id)
            .filter(
                Q(payment_status__in=['pending', 'failed'])
                | Q(ticket__isnull=True)
                | Q(ticket__email_sent=False)
            )
            .exclude(ticket__status='cancelled')
            .select_related('user')
            .order_by('id')
            .distinct()
        )
        batch = list(candidates[:SYNC_BATCH + 1])
        more = len(batch) > SYNC_BATCH
        batch = batch[:SYNC_BATCH]
        index = CheckoutIndex()
        results = []
        for participant in batch:
            outcome = sync_payment(participant, index=index, sent_by=request.user)
            results.append(outcome)
            if outcome['result'] == 'error':
                break  # Chargily unreachable / not configured: no point going on
        summary = {}
        for outcome in results:
            summary[outcome['result']] = summary.get(outcome['result'], 0) + 1
        return Response({
            'results': results,
            'summary': summary,
            'next_after_id': batch[-1].id if (more and batch and results[-1]['result'] != 'error') else None,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Participant statistics for the HR dashboard"""
        seven_days_ago = timezone.now() - timedelta(days=7)
        today = timezone.localdate()
        counts = Participant.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status=Participant.Status.PENDING)),
            approved=Count('id', filter=Q(status=Participant.Status.APPROVED)),
            rejected=Count('id', filter=Q(status=Participant.Status.REJECTED)),
            paid=Count('id', filter=Q(payment_status='paid')),
            payment_pending=Count('id', filter=Q(payment_status='pending')),
            payment_failed=Count('id', filter=Q(payment_status='failed')),
            recent=Count('id', filter=Q(registered_at__gte=seven_days_ago)),
            today=Count('id', filter=Q(registered_at__date=today)),
        )
        participant_types = Participant.objects.values('participant_type').annotate(count=Count('id'))
        university_distribution = (
            Participant.objects.exclude(university='')
            .values('university').annotate(count=Count('id')).order_by('-count')[:5]
        )
        total = counts['total']
        return Response({
            'total_participants': total,
            'status_breakdown': {
                'pending': counts['pending'],
                'approved': counts['approved'],
                'rejected': counts['rejected'],
            },
            'payment_breakdown': {
                'paid': counts['paid'],
                'pending': counts['payment_pending'],
                'failed': counts['payment_failed'],
            },
            'participant_types': list(participant_types),
            'university_distribution': list(university_distribution),
            'recent_registrations_7_days': counts['recent'],
            'today_registrations': counts['today'],
            'approval_rate': round(counts['approved'] / total * 100, 2) if total else 0,
            'pending_approvals': counts['pending'],
        }, status=status.HTTP_200_OK)

    def _by_status(self, value):
        participants = self.get_queryset().filter(status=value)
        return Response({
            'count': participants.count(),
            'results': self.get_serializer(participants, many=True).data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        return self._by_status(Participant.Status.PENDING)

    @action(detail=False, methods=['get'])
    def approved(self, request):
        return self._by_status(Participant.Status.APPROVED)

    @action(detail=False, methods=['get'])
    def rejected(self, request):
        return self._by_status(Participant.Status.REJECTED)


class ParticipantManualyRegistrationView(APIView):
    """HR registers a participant by hand; they are approved straight away
    (and receive the approval email with their payment link)."""
    permission_classes = [IsHRAdmin]

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register and approve a participant (HR)",
    )
    def post(self, request):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                participant = serializer.save()
                set_status([participant.id], Participant.Status.APPROVED, by=request.user)
        except IntegrityError:
            return Response({"email": ["This email is already registered."]}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Manual registration failed")
            return Response({"error": "Registration failed. Please try again."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            "message": "Participant registered successfully.",
            "participant_id": participant.id,
            "email": participant.email,
        }, status=status.HTTP_201_CREATED)


class FeedbackView(APIView):
    """A logged-in participant sends feedback about the event."""
    permission_classes = [IsParticipant]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    throttle_scope = 'feedback'

    @swagger_auto_schema(
        request_body=FeedbackSerializer,
        operation_summary="Submit feedback",
    )
    def post(self, request):
        participant = _own_profile(request)
        if participant is None:
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = FeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        feedback = serializer.save(participant=participant)
        return Response({
            "message": "Feedback submitted successfully.",
            "feedback_id": feedback.id
        }, status=status.HTTP_201_CREATED)


MAX_IMAGES = 5
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.gif', '.webp')


@api_view(['POST'])
@permission_classes([IsParticipant])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """Upload up to MAX_IMAGES profile images for the logged-in participant."""
    participant = _own_profile(request)
    if participant is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    files = request.FILES.getlist('files')
    if not files:
        return Response({'error': 'No files uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Lock the participant row so two parallel uploads can't both pass the limit
        Participant.objects.select_for_update().filter(pk=participant.pk).first()
        current_image_count = participant.images.count()
        available_slots = MAX_IMAGES - current_image_count
        if available_slots <= 0 or len(files) > available_slots:
            return Response({
                'error': f'You can upload {max(available_slots, 0)} more image(s). Maximum is {MAX_IMAGES} total.',
                'current_images': current_image_count,
                'max_images': MAX_IMAGES,
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_images, errors = [], []
        for file in files:
            if not file.name.lower().endswith(ALLOWED_IMAGE_EXTENSIONS):
                errors.append(f"{file.name}: Only image files (JPG, PNG, GIF, WEBP) are allowed.")
                continue
            if file.size > MAX_IMAGE_BYTES:
                errors.append(f"{file.name}: File size exceeds 10MB limit.")
                continue
            try:
                upload_result = cloudinary_upload(
                    file,
                    # Random name: never build storage paths from the user's filename
                    public_id=f"image_{participant.id}_{uuid.uuid4().hex}",
                    resource_type='image',
                    folder="participants/images",
                    access_mode='public',
                )
                participant_image = ParticipantImage.objects.create(
                    participant=participant,
                    image_url=upload_result.get('secure_url') or upload_result.get('url'),
                    cloudinary_public_id=upload_result.get('public_id'),
                )
                uploaded_images.append({
                    'id': participant_image.id,
                    'file_name': file.name,
                    'file_url': participant_image.image_url,
                    'uploaded_at': participant_image.uploaded_at,
                })
            except Exception:
                logger.exception("Image upload failed for participant %s", participant.id)
                errors.append(f"{file.name}: Upload failed.")

    if not uploaded_images and errors:
        return Response({'error': 'No images uploaded successfully', 'details': errors},
                        status=status.HTTP_400_BAD_REQUEST)
    response_data = {
        'message': f'{len(uploaded_images)} image(s) uploaded successfully',
        'uploaded_images': uploaded_images,
    }
    if errors:
        response_data['warnings'] = errors
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsParticipant])
def get_participant_images(request):
    """All images of the logged-in participant."""
    participant = _own_profile(request)
    if participant is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    images = participant.images.all()
    data = ParticipantImageSerializer(images, many=True).data
    if not data:
        return Response({'message': 'No images uploaded yet.', 'images': []}, status=status.HTTP_200_OK)
    return Response({
        'participant_id': participant.id,
        'participant_name': participant.full_name,
        'total_images': len(data),
        'images': data,
    }, status=status.HTTP_200_OK)


def _delete_from_cloudinary(public_ids):
    if not public_ids:
        return
    try:
        from cloudinary.api import delete_resources
        delete_resources(public_ids)
    except Exception:
        # The DB row goes anyway; an orphan file in Cloudinary is harmless
        logger.warning("Cloudinary deletion failed for %s", public_ids, exc_info=True)


@api_view(['DELETE'])
@permission_classes([IsParticipant])
def delete_image(request, image_id):
    """Delete one of the logged-in participant's images."""
    participant = _own_profile(request)
    if participant is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    image = get_object_or_404(ParticipantImage, id=image_id, participant=participant)
    _delete_from_cloudinary([image.cloudinary_public_id])
    image.delete()
    return Response({'message': 'Image deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsParticipant])
def delete_all_images(request):
    """Delete all images of the logged-in participant."""
    participant = _own_profile(request)
    if participant is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    images = participant.images.all()
    public_ids = list(images.values_list('cloudinary_public_id', flat=True))
    if not public_ids:
        return Response({'message': 'No images to delete.'}, status=status.HTTP_200_OK)
    _delete_from_cloudinary(public_ids)
    deleted_count = len(public_ids)
    images.delete()
    return Response({
        'message': f'{deleted_count} image(s) deleted successfully',
        'deleted_count': deleted_count
    }, status=status.HTTP_200_OK)


def _linkable_participant(request, participant_id):
    """(current, target, error_response) for participant-to-participant links."""
    current = _own_profile(request)
    if current is None:
        return None, None, Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    target = Participant.objects.filter(id=participant_id).first()
    if target is None or target.status != Participant.Status.APPROVED:
        return current, None, Response({'error': 'Participant not found.'}, status=status.HTTP_404_NOT_FOUND)
    if target.id == current.id:
        return current, None, Response({'error': 'You cannot link to yourself.'}, status=status.HTTP_400_BAD_REQUEST)
    return current, target, None


@api_view(['POST'])
@permission_classes([IsParticipant])
def link_participant(request, participant_id):
    """Save another (approved) participant to your contacts, e.g. after scanning their QR."""
    current, target, error = _linkable_participant(request, participant_id)
    if error:
        return error
    link, created = ParticipantParticipantLink.objects.get_or_create(current_participant=current, participant=target)
    if not created:
        return Response({'message': 'This participant is already linked to your profile.'}, status=status.HTTP_200_OK)
    return Response({
        'message': f'Successfully linked participant {target.full_name} to {current.full_name}',
        'link_id': link.id,
        'created_at': link.created_at
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsParticipant])
def unlink_participant(request, participant_id):
    """Remove a participant from your contacts."""
    current = _own_profile(request)
    if current is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    link = ParticipantParticipantLink.objects.filter(
        current_participant=current, participant_id=participant_id,
    ).select_related('participant').first()
    if not link:
        return Response({'error': 'This participant is not linked to you.'}, status=status.HTTP_404_NOT_FOUND)
    name = link.participant.full_name
    link.delete()
    return Response({
        'message': f'Successfully unlinked participant {name} from {current.full_name}'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsParticipant])
def list_linked_participants(request):
    """Participants the logged-in participant has linked."""
    current = _own_profile(request)
    if current is None:
        return Response({'error': 'Participant profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    links = ParticipantParticipantLink.objects.filter(
        current_participant=current,
    ).select_related('participant__user')
    participants = [{
        'id': link.participant.id,
        'name': link.participant.full_name,
        'email': link.participant.email,
        'field_of_study': link.participant.field_of_study,
        'university': link.participant.university,
        'linkedin_url': link.participant.linkedin_url,
        'linked_at': link.created_at
    } for link in links]
    return Response({
        'message': 'List of linked participants.',
        'linked_participants_count': len(participants),
        'linked_participants': participants
    }, status=status.HTTP_200_OK)
