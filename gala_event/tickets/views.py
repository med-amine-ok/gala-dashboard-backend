from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from datetime import timedelta
import qrcode
from io import BytesIO
import base64

from .models import Ticket, TicketScan
from .serializers import TicketSerializer
from participants.models import Participant


class TicketViewSet(viewsets.ModelViewSet):
    """Full CRUD operations for tickets (HR Admin only)"""
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'participant__status']
    search_fields = ['ticket_number', 'participant__first_name', 'participant__last_name', 'participant__email']
    ordering_fields = ['created_at', 'issued_date', 'ticket_number']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter tickets based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by participant status
        participant_status = self.request.query_params.get('participant_status')
        if participant_status:
            queryset = queryset.filter(participant__status=participant_status)
            
        # Filter by check-in status
        checked_in = self.request.query_params.get('checked_in')
        if checked_in == 'true':
            queryset = queryset.filter(status='checked_in')
        elif checked_in == 'false':
            queryset = queryset.exclude(status='checked_in')
            
        return queryset

    @action(detail=False, methods=['post'])
    def generate_tickets(self, request):
        """Generate tickets for all approved participants without tickets"""
        approved_participants = Participant.objects.filter(
            status='approved',
            ticket__isnull=True
        )
        
        tickets_created = []
        
        for participant in approved_participants:
            ticket = Ticket.objects.create(
                participant=participant,
                issued_by=request.user
            )
            tickets_created.append({
                'participant': f"{participant.first_name} {participant.last_name}",
                'ticket_number': ticket.ticket_number,
                'participant_id': participant.id
            })
        
        return Response({
            'message': f'Generated {len(tickets_created)} tickets',
            'tickets_created': tickets_created
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def bulk_generate(self, request):
        """Generate tickets for specific participants"""
        participant_ids = request.data.get('participant_ids', [])
        
        if not participant_ids:
            return Response(
                {'error': 'participant_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participants = Participant.objects.filter(
            id__in=participant_ids,
            status='approved',
            ticket__isnull=True
        )
        
        tickets_created = []
        
        for participant in participants:
            ticket = Ticket.objects.create(
                participant=participant,
                issued_by=request.user
            )
            tickets_created.append({
                'participant': f"{participant.first_name} {participant.last_name}",
                'ticket_number': ticket.ticket_number,
                'participant_id': participant.id
            })
        
        return Response({
            'message': f'Generated {len(tickets_created)} tickets',
            'tickets_created': tickets_created
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel_ticket(self, request, pk=None):
        """Cancel a specific ticket"""
        ticket = self.get_object()
        ticket.status = 'cancelled'
        ticket.save()
        
        return Response({
            'message': f'Ticket {ticket.ticket_number} has been cancelled'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reactivate_ticket(self, request, pk=None):
        """Reactivate a cancelled ticket"""
        ticket = self.get_object()
        if ticket.status == 'cancelled':
            ticket.status = 'active'
            ticket.save()
            return Response({
                'message': f'Ticket {ticket.ticket_number} has been reactivated'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Only cancelled tickets can be reactivated'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def generate_qr(self, request, pk=None):
        """Generate QR code for a specific ticket"""
        ticket = self.get_object()
        
        # Create QR code data
        qr_data = {
            'ticket_number': ticket.ticket_number,
            'participant_id': ticket.participant.id,
            'event': 'Gala Event 2025'
        }
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(f"TICKET:{ticket.ticket_number}")
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'ticket_number': ticket.ticket_number,
            'qr_code': f'data:image/png;base64,{img_str}',
            'participant': f"{ticket.participant.first_name} {ticket.participant.last_name}"
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get ticket statistics for dashboard"""
        total_tickets = Ticket.objects.count()
        active_tickets = Ticket.objects.filter(status='active').count()
        used_tickets = Ticket.objects.filter(status='used').count()
        checked_in_tickets = Ticket.objects.filter(status='checked_in').count()
        cancelled_tickets = Ticket.objects.filter(status='cancelled').count()
        
        # Check-in rate
        checkin_rate = 0
        if total_tickets > 0:
            checkin_rate = round((checked_in_tickets / total_tickets) * 100, 2)
        
        # Recent check-ins (last 24 hours)
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        recent_checkins = TicketScan.objects.filter(
            scanned_at__gte=twenty_four_hours_ago,
            scan_type='check_in'
        ).count()
        
        # Tickets issued today
        today = timezone.now().date()
        tickets_today = Ticket.objects.filter(
            created_at__date=today
        ).count()
        
        # Participants without tickets (approved but no ticket)
        approved_without_tickets = Participant.objects.filter(
            status='approved',
            ticket__isnull=True
        ).count()
        
        return Response({
            'total_tickets': total_tickets,
            'status_breakdown': {
                'active': active_tickets,
                'used': used_tickets,
                'checked_in': checked_in_tickets,
                'cancelled': cancelled_tickets
            },
            'checkin_rate_percentage': checkin_rate,
            'recent_checkins_24h': recent_checkins,
            'tickets_issued_today': tickets_today,
            'approved_participants_without_tickets': approved_without_tickets,
            'total_scans': TicketScan.objects.count()
        }, status=status.HTTP_200_OK)


class TicketCheckInView(APIView):
    """Handle ticket check-in operations"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Check-in a ticket using ticket number or QR scan"""
        ticket_number = request.data.get('ticket_number')
        scan_type = request.data.get('scan_type', 'check_in')  # check_in or check_out
        
        if not ticket_number:
            return Response(
                {'error': 'ticket_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ticket = Ticket.objects.get(ticket_number=ticket_number)
        except Ticket.DoesNotExist:
            return Response(
                {'error': 'Invalid ticket number'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if ticket is valid
        if ticket.status == 'cancelled':
            return Response(
                {'error': 'This ticket has been cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if ticket.status == 'used' and scan_type == 'check_in':
            return Response(
                {'error': 'This ticket has already been used'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update ticket status
        if scan_type == 'check_in':
            ticket.status = 'checked_in'
            message = 'Successfully checked in'
        else:
            ticket.status = 'used'
            message = 'Successfully checked out'
            
        ticket.save()
        
        # Log the scan
        TicketScan.objects.create(
            ticket=ticket,
            scanned_by=request.user,
            scan_type=scan_type,
            scanned_at=timezone.now()
        )
        
        return Response({
            'message': message,
            'ticket_number': ticket.ticket_number,
            'participant': f"{ticket.participant.first_name} {ticket.participant.last_name}",
            'participant_email': ticket.participant.email,
            'scan_time': timezone.now(),
            'status': ticket.status
        }, status=status.HTTP_200_OK)


class TicketVerificationView(APIView):
    """Public ticket verification (no authentication required)"""
    permission_classes = [AllowAny]
    
    def get(self, request, ticket_number):
        """Verify ticket validity without sensitive information"""
        try:
            ticket = Ticket.objects.select_related('participant').get(
                ticket_number=ticket_number
            )
            
            return Response({
                'valid': True,
                'status': ticket.status,
                'participant_name': f"{ticket.participant.first_name} {ticket.participant.last_name}",
                'issued_date': ticket.issued_date,
                'can_checkin': ticket.status in ['active', 'used']
            }, status=status.HTTP_200_OK)
            
        except Ticket.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Ticket not found'
            }, status=status.HTTP_404_NOT_FOUND)


class TicketScanHistoryView(APIView):
    """View ticket scan history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, ticket_id=None):
        """Get scan history for a ticket or all scans"""
        if ticket_id:
            scans = TicketScan.objects.filter(
                ticket_id=ticket_id
            ).select_related('ticket', 'scanned_by').order_by('-scanned_at')
        else:
            scans = TicketScan.objects.select_related(
                'ticket', 'scanned_by'
            ).order_by('-scanned_at')[:50]  # Limit to recent 50 scans
        
        scan_data = []
        for scan in scans:
            scan_data.append({
                'id': scan.id,
                'ticket_number': scan.ticket.ticket_number,
                'participant': f"{scan.ticket.participant.first_name} {scan.ticket.participant.last_name}",
                'scan_type': scan.scan_type,
                'scanned_by': scan.scanned_by.username,
                'scanned_at': scan.scanned_at
            })
        
        return Response({
            'scans': scan_data,
            'total_scans': len(scan_data)
        }, status=status.HTTP_200_OK)