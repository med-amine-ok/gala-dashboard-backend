import json
import logging
from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsHRAdmin
from participants.models import Participant
from .models import Ticket, TicketScan
from .payment_handlers import PaymentError, assign_ticket_with_payment, email_ticket, handle_payment_success
from .serializers import AssignTicketSerializer, GenerateUnassignedTicketsSerializer, TicketSerializer

logger = logging.getLogger(__name__)


class TicketPagination(PageNumberPagination):
    """Custom pagination for ticket lists"""
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 1000


class TicketViewSet(viewsets.ModelViewSet):
    """Full CRUD operations for tickets (HR Admin only)"""
    queryset = Ticket.objects.all().select_related('participant__user', 'checked_in_by').order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsHRAdmin]
    pagination_class = TicketPagination
    filterset_fields = ['status', 'participant__status']
    search_fields = [
        'serial_number', 'participant__first_name', 'participant__last_name', 'participant__email',
        'participant__user__first_name', 'participant__user__last_name',
    ]
    ordering_fields = ['created_at', 'issued_at', 'serial_number', 'checked_in_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter tickets based on query parameters"""
        queryset = super().get_queryset()

        participant_status = self.request.query_params.get('participant_status')
        if participant_status:
            queryset = queryset.filter(participant__status=participant_status.upper())

        checked_in = self.request.query_params.get('checked_in')
        if checked_in == 'true':
            queryset = queryset.filter(status='checked_in')
        elif checked_in == 'false':
            queryset = queryset.exclude(status='checked_in')

        return queryset

    @action(detail=True, methods=['post'])
    def cancel_ticket(self, request, pk=None):
        """Cancel a specific ticket"""
        ticket = self.get_object()
        ticket.cancel_ticket()
        return Response({
            'message': f'Ticket {ticket.serial_number} has been cancelled'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def resend_email(self, request, pk=None):
        """Email the ticket to its holder again"""
        ticket = self.get_object()
        if ticket.participant_id is None:
            return Response({'error': 'This ticket is not assigned to anyone.'}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.status == 'cancelled':
            return Response({'error': 'This ticket is cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        sent = email_ticket(ticket.participant_id, sent_by=request.user, force=True)
        if not sent:
            return Response(
                {'error': 'The email could not be sent. Check the email settings (see email logs).', 'email_sent': False},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'message': f'Ticket {ticket.serial_number} emailed to {ticket.participant.email}.',
                         'email_sent': True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get ticket statistics for dashboard"""
        counts = Ticket.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status='active')),
            assigned=Count('id', filter=Q(status='assigned')),
            checked_in=Count('id', filter=Q(status='checked_in')),
            cancelled=Count('id', filter=Q(status='cancelled')),
            today=Count('id', filter=Q(created_at__date=timezone.localdate())),
        )
        total_tickets = counts['total']
        recent_checkins = TicketScan.objects.filter(
            scan_datetime__gte=timezone.now() - timedelta(hours=24),
            scan_result='valid'
        ).count()
        approved_without_tickets = Participant.objects.filter(
            status=Participant.Status.APPROVED,
            ticket__isnull=True
        ).count()

        return Response({
            'total_tickets': total_tickets,
            'status_breakdown': {
                'active': counts['active'],
                'assigned': counts['assigned'],
                'checked_in': counts['checked_in'],
                'cancelled': counts['cancelled'],
            },
            'checkin_rate_percentage': round(counts['checked_in'] / total_tickets * 100, 2) if total_tickets else 0,
            'recent_checkins_24h': recent_checkins,
            'tickets_issued_today': counts['today'],
            'approved_participants_without_tickets': approved_without_tickets,
            'total_scans': TicketScan.objects.count()
        }, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        method='post',
        request_body=GenerateUnassignedTicketsSerializer,
        responses={status.HTTP_201_CREATED: TicketSerializer(many=True)}
    )
    @action(detail=False, methods=['post'])
    def generate_unassigned_tickets(self, request):
        """Generate a number of tickets that are not yet given to anyone"""
        serializer = GenerateUnassignedTicketsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = serializer.validated_data['count']

        tickets_created = []
        for _ in range(count):
            ticket = Ticket.objects.create(participant=None, status='active')
            tickets_created.append({'serial_number': ticket.serial_number, 'id': ticket.id, 'status': ticket.status})

        return Response({
            'success': True,
            'message': f'Generated {len(tickets_created)} unassigned tickets',
            'count': len(tickets_created),
            'tickets': tickets_created
        }, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        method='post',
        request_body=AssignTicketSerializer,
        responses={
            status.HTTP_200_OK: openapi.Response(description="Ticket assigned successfully"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid request"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Ticket or participant not found"),
        },
    )
    @action(detail=False, methods=['post'])
    def assign_ticket(self, request):
        """Give a pre-generated ticket to an APPROVED participant and record the payment"""
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            participant, ticket, email_sent = assign_ticket_with_payment(
                serializer.validated_data['participant_id'],
                serializer.validated_data['ticket_serial'],
                sent_by=request.user,
            )
        except PaymentError as exc:
            return Response({"error": str(exc)}, status=exc.status_code)

        return Response({
            "success": True,
            "message": (
                f"Ticket assigned and emailed to {participant.email}." if email_sent
                else "Ticket assigned, but the email could not be sent. Use 'Resend email' after fixing the email settings."
            ),
            "email_sent": email_sent,
            "data": {
                "participant_id": participant.id,
                "participant_name": participant.full_name,
                "ticket_serial": ticket.serial_number,
                "ticket_status": ticket.status,
                "payment_status": participant.payment_status,
                "payment_reference": serializer.validated_data.get('reference'),
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def unassigned_tickets(self, request):
        """List all unassigned tickets"""
        tickets = list(
            Ticket.objects.filter(participant__isnull=True)
            .exclude(status='cancelled')
            .order_by('-created_at')
            .values('id', 'serial_number', 'status', 'created_at')
        )
        return Response({'success': True, 'count': len(tickets), 'tickets': tickets}, status=status.HTTP_200_OK)


def _extract_serial(raw):
    """Accept a plain serial or the JSON payload printed in the ticket QR code."""
    raw = (raw or '').strip()
    if raw.startswith('{'):
        try:
            data = json.loads(raw)
            raw = str(data.get('serialNumber') or data.get('serial_number') or '')
        except (ValueError, AttributeError):
            return ''
    return raw.strip().upper()


class TicketCheckInView(APIView):
    """Check a ticket in (or out) at the entrance. HR / staff accounts only."""
    permission_classes = [IsHRAdmin]

    def post(self, request):
        serial_number = _extract_serial(request.data.get('serial_number'))
        action_name = request.data.get('action', 'check_in')
        if action_name not in ('check_in', 'check_out'):
            return Response({'error': "action must be 'check_in' or 'check_out'"}, status=status.HTTP_400_BAD_REQUEST)
        if not serial_number:
            return Response({'error': 'serial_number is required'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the ticket so two scanners can't both admit the same ticket
            ticket = (
                Ticket.objects.select_for_update(of=('self',))
                .select_related('participant__user')
                .filter(serial_number=serial_number)
                .first()
            )
            if ticket is None:
                return Response({'error': 'Invalid ticket number'}, status=status.HTTP_404_NOT_FOUND)

            def refuse(message, scan_result):
                TicketScan.objects.create(ticket=ticket, scanned_by=request.user, scan_result=scan_result)
                return Response({'error': message, 'serial_number': ticket.serial_number},
                                status=status.HTTP_400_BAD_REQUEST)

            if ticket.status == 'cancelled':
                return refuse('This ticket has been cancelled', 'cancelled')
            participant = ticket.participant
            if participant is None:
                return refuse('This ticket is not assigned to anyone', 'invalid')
            if participant.status != Participant.Status.APPROVED:
                return refuse('The ticket holder is not approved', 'invalid')

            if action_name == 'check_in':
                if ticket.status == 'checked_in':
                    when = timezone.localtime(ticket.checked_in_at).strftime('%H:%M') if ticket.checked_in_at else ''
                    return refuse(f'This ticket has already been checked in {when}'.strip(), 'already_checked_in')
                ticket.check_in(request.user)
                message, scan_result = 'Successfully checked in', 'valid'
            else:
                if ticket.status != 'checked_in':
                    return refuse('This ticket is not checked in', 'invalid')
                ticket.status = 'assigned'
                ticket.save(update_fields=['status', 'updated_at'])
                message, scan_result = 'Successfully checked out', 'checked_out'

            TicketScan.objects.create(ticket=ticket, scanned_by=request.user, scan_result=scan_result)

        return Response({
            'message': message,
            'serial_number': ticket.serial_number,
            'participant': participant.full_name,
            'participant_email': participant.email,
            'scan_time': timezone.now(),
            'status': ticket.status
        }, status=status.HTTP_200_OK)


class TicketVerificationView(APIView):
    """Public check of a ticket number. Deliberately reveals no personal data."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'ticket_verify'

    def get(self, request, serial_number):
        ticket = Ticket.objects.filter(serial_number=_extract_serial(serial_number)).first()
        if ticket is None or ticket.participant_id is None:
            return Response({'valid': False, 'error': 'Ticket not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'valid': ticket.status != 'cancelled',
            'status': ticket.status,
            'issued_date': ticket.issued_at,
            'can_checkin': ticket.status in ['active', 'assigned'],
        }, status=status.HTTP_200_OK)


class TicketScanHistoryView(APIView):
    """Scan history (HR only): one ticket with ?ticket_id=, else the latest 50 scans."""
    permission_classes = [IsHRAdmin]

    def get(self, request):
        scans = TicketScan.objects.select_related('ticket__participant__user', 'scanned_by').order_by('-scan_datetime')
        ticket_id = request.query_params.get('ticket_id')
        if ticket_id:
            if not ticket_id.isdigit():
                return Response({'error': 'ticket_id must be a number'}, status=status.HTTP_400_BAD_REQUEST)
            scans = scans.filter(ticket_id=int(ticket_id))
        else:
            scans = scans[:50]

        scan_data = [{
            'id': scan.id,
            'serial_number': scan.ticket.serial_number,
            'participant': scan.ticket.participant.full_name if scan.ticket.participant else None,
            'participant_name': scan.ticket.participant.full_name if scan.ticket.participant else None,
            'scan_result': scan.scan_result,
            'scanned_by': scan.scanned_by.username,
            'scan_datetime': scan.scan_datetime
        } for scan in scans]

        return Response({'scans': scan_data, 'total_scans': len(scan_data)}, status=status.HTTP_200_OK)


class ManualPaymentView(APIView):
    """HR records a payment received outside the online checkout"""
    permission_classes = [IsHRAdmin]

    @swagger_auto_schema(
        operation_summary="Record a manual payment",
        operation_description="Marks an APPROVED participant as paid, gives them a ticket and emails a confirmation.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['participant_id'],
            properties={
                'participant_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'reference': openapi.Schema(type=openapi.TYPE_STRING, description="Optional payment reference"),
            }
        ),
        responses={200: "Payment recorded", 400: "Invalid request", 404: "Participant not found"}
    )
    def post(self, request):
        participant_id = request.data.get('participant_id')
        try:
            participant_id = int(participant_id)
        except (TypeError, ValueError):
            return Response({"error": "participant_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = handle_payment_success(
                participant_id, payment_reference=request.data.get('reference'), sent_by=request.user,
            )
        except PaymentError as exc:
            return Response({"success": False, "message": str(exc)}, status=exc.status_code)
        return Response(result, status=status.HTTP_200_OK)
