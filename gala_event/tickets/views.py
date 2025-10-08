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
from .payment_handlers import handle_payment_success
from .models import Ticket, TicketScan
from .serializers import (
    TicketSerializer,
    GenerateUnassignedTicketsSerializer,
    AssignTicketSerializer,
)
from participants.models import Participant
from accounts.permissions import IsHRAdmin
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class TicketViewSet(viewsets.ModelViewSet):
    """Full CRUD operations for tickets (HR Admin only)"""
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [IsHRAdmin]
    filterset_fields = ['status', 'participant__status']
    search_fields = ['serial_number', 'participant__full_name', 'participant__email']
    ordering_fields = ['created_at', 'issued_date', 'serial_number']
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

    # @action(detail=False, methods=['post'])
    # def generate_tickets(self, request):
    #     """Generate tickets for all approved participants without tickets"""
    #     approved_participants = Participant.objects.filter(
    #         status='approved',
    #         ticket__isnull=True
    #     )
        
    #     tickets_created = []
        
    #     for participant in approved_participants:
    #         ticket = Ticket.objects.create(
    #             participant=participant
    #         )
    #         tickets_created.append({
    #             'participant': f"{participant.full_name} ",
    #             'serial_number': ticket.serial_number,
    #             'participant_id': participant.id
    #         })
        
    #     return Response({
    #         'message': f'Generated {len(tickets_created)} tickets',
    #         'tickets_created': tickets_created
    #     }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel_ticket(self, request, pk=None):
        """Cancel a specific ticket"""
        ticket = self.get_object()
        ticket.status = 'cancelled'
        ticket.save()
        
        return Response({
            'message': f'Ticket {ticket.serial_number} has been cancelled'
        }, status=status.HTTP_200_OK)

    # @action(detail=True, methods=['post'])
    # def reactivate_ticket(self, request, pk=None):
    #     """Reactivate a cancelled ticket"""
    #     ticket = self.get_object()
    #     if ticket.status == 'cancelled':
    #         ticket.status = 'active'
    #         ticket.save()
    #         return Response({
    #             'message': f'Ticket {ticket.serial_number} has been reactivated'
    #         }, status=status.HTTP_200_OK)
    #     else:
    #         return Response({
    #             'error': 'Only cancelled tickets can be reactivated'
    #         }, status=status.HTTP_400_BAD_REQUEST)

    # @action(detail=True, methods=['get'])
    # def generate_qr(self, request, pk=None):
    #     """Generate QR code for a specific ticket"""
    #     ticket = self.get_object()
        
    #     # Create QR code data
    #     qr_data = {
    #         'serial_number': ticket.serial_number,
    #         'participant_id': ticket.participant.id,
    #         'event': 'Gala Event 2025'
    #     }
        
    #     # Generate QR code
    #     qr = qrcode.QRCode(
    #         version=1,
    #         error_correction=qrcode.constants.ERROR_CORRECT_L,
    #         box_size=10,
    #         border=4,
    #     )
    #     qr.add_data(f"TICKET:{ticket.serial_number}")
    #     qr.make(fit=True)
        
    #     # Create QR code image
    #     img = qr.make_image(fill_color="black", back_color="white")
        
    #     # Convert to base64
    #     buffer = BytesIO()
    #     img.save(buffer, format='PNG')
    #     img_str = base64.b64encode(buffer.getvalue()).decode()
        
    #     return Response({
    #         'serial_number': ticket.serial_number,
    #         # 'qr_code': f'data:image/png;base64,{img_str}',
    #         'participant': f"{ticket.participant.full_name}  "
    #     }, status=status.HTTP_200_OK)

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
            scan_datetime__gte=twenty_four_hours_ago,
            scan_result='valid'
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
    
    @swagger_auto_schema(
        method='post',
        request_body=GenerateUnassignedTicketsSerializer,
        responses={status.HTTP_201_CREATED: TicketSerializer(many=True)}
    )
    @action(detail=False, methods=['post'])
    def generate_unassigned_tickets(self, request):
        """Generate a specified number of tickets without assigning to participants"""
        serializer = GenerateUnassignedTicketsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        count = serializer.validated_data['count']
        
        tickets_created = []
        
        # Create tickets without participants
        for i in range(count):
            try:
                # Create ticket without participant
                ticket = Ticket.objects.create(
                    participant=None,
                    status='active'  # Explicitly set status
                )
                tickets_created.append({
                    'serial_number': ticket.serial_number,
                    'id': ticket.id,
                    'status': ticket.status
                })
            except Exception as e:
                # If any ticket fails, log it but continue
                print(f"Error creating ticket {i+1}: {str(e)}")
                continue
        
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
        """Assign an unassigned ticket to a participant and process payment"""
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        participant_id = serializer.validated_data['participant_id']
        ticket_serial = serializer.validated_data['ticket_serial']
        payment_reference = serializer.validated_data.get('reference')
        
        try:
            # Get the participant
            participant = Participant.objects.get(id=participant_id)
            
            # Check if participant already has a ticket
            existing_ticket = Ticket.objects.filter(participant=participant).first()
            if existing_ticket:
                return Response(
                    {
                        "error": f"Participant already has ticket {existing_ticket.serial_number}",
                        "existing_ticket": existing_ticket.serial_number
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the unassigned ticket
            try:
                ticket = Ticket.objects.get(
                    serial_number=ticket_serial,
                    participant__isnull=True  # Ensure it's unassigned
                )
            except Ticket.DoesNotExist:
                # Check if ticket exists but is assigned
                if Ticket.objects.filter(serial_number=ticket_serial).exists():
                    assigned_ticket = Ticket.objects.get(serial_number=ticket_serial)
                    return Response(
                        {
                            "error": f"Ticket {ticket_serial} is already assigned to {assigned_ticket.participant.full_name}",
                            "assigned_to": assigned_ticket.participant.id
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {"error": f"Ticket with serial number {ticket_serial} not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Assign ticket to participant
            ticket.participant = participant
            ticket.status = 'active'  # Ensure ticket is active
            ticket.save()
            
            # Update payment status
            participant.payment_status = "paid"
            participant.status = "approved"  # Ensure participant is approved
            participant.save()  
            
            # Ensure user account exists and is active
            if participant.user:
                if not participant.user.is_active:
                    participant.user.is_active = True
                    participant.user.save()
            
            return Response({
                "success": True,
                "message": "Ticket assigned and payment processed successfully",
                "data": {
                    "participant_id": participant.id,
                    "participant_name": participant.full_name,
                    "ticket_serial": ticket.serial_number,
                    "ticket_status": ticket.status,
                    "payment_status": participant.payment_status,
                    "payment_reference": payment_reference
                }
            }, status=status.HTTP_200_OK)
            
        except Participant.DoesNotExist:
            return Response(
                {"error": f"Participant with ID {participant_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "error": f"Error assigning ticket: {str(e)}",
                    "details": str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    
    @action(detail=False, methods=['get'])
    def unassigned_tickets(self, request):
        """List all unassigned tickets"""
        unassigned = Ticket.objects.filter(
            participant__isnull=True
        ).order_by('-created_at')
        
        # Optional pagination
        page = request.query_params.get('page')
        page_size = request.query_params.get('page_size', 50)
        
        tickets_data = []
        for ticket in unassigned:
            tickets_data.append({
                'id': ticket.id,
                'serial_number': ticket.serial_number,
                'status': ticket.status,
                'created_at': ticket.created_at.isoformat() if hasattr(ticket, 'created_at') else None
            })
        
        return Response({
            'success': True,
            'count': len(tickets_data),
            'tickets': tickets_data
        }, status=status.HTTP_200_OK)


class TicketCheckInView(APIView):
    """Handle ticket check-in operations"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Check-in a ticket using ticket number or QR scan"""
        serial_number = request.data.get('serial_number')
        action = request.data.get('action', 'check_in')  # 'check_in' or 'check_out'
        
        if not serial_number:
            return Response(
                {'error': 'serial_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ticket = Ticket.objects.get(serial_number=serial_number)
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
        
        if ticket.status == 'used' and action == 'check_in':
            return Response(
                {'error': 'This ticket has already been used'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update ticket status and determine scan_result
        if action == 'check_in':
            ticket.status = 'checked_in'
            message = 'Successfully checked in'
            scan_result = 'valid'
        else:
            ticket.status = 'used'
            message = 'Successfully checked out'
            scan_result = 'valid'
            
        ticket.save()
        
        # Log the scan
        TicketScan.objects.create(
            ticket=ticket,
            scanned_by=request.user,
            scan_result=scan_result,
        )
        
        return Response({
            'message': message,
            'serial_number': ticket.serial_number,
            'participant': f"{ticket.participant.full_name}  ",
            'participant_email': ticket.participant.email,
            'scan_time': timezone.now(),
            'status': ticket.status
        }, status=status.HTTP_200_OK)


class TicketVerificationView(APIView):
    """Public ticket verification (no authentication required)"""
    permission_classes = [AllowAny]
    
    def get(self, request, serial_number):
        """Verify ticket validity without sensitive information"""
        try:
            ticket = Ticket.objects.select_related('participant').get(
                serial_number=serial_number
            )
            
            return Response({
                'valid': True,
                'status': ticket.status,
                'participant_name': f"{ticket.participant.full_name}  ",
                'issued_date': ticket.issued_at,
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
            ).select_related('ticket', 'scanned_by').order_by('-scan_datetime')
        else:
            scans = TicketScan.objects.select_related(
                'ticket', 'scanned_by'
            ).order_by('-scan_datetime')[:50]  # Limit to recent 50 scans
        
        scan_data = []
        for scan in scans:
            scan_data.append({
                'id': scan.id,
                'serial_number': scan.ticket.serial_number,
                'participant': f"{scan.ticket.participant.full_name}",
                'scan_result': scan.scan_result,
                'scanned_by': scan.scanned_by.username,
                'scan_datetime': scan.scan_datetime
            })
        
        return Response({
            'scans': scan_data,
            'total_scans': len(scan_data)
        }, status=status.HTTP_200_OK)

class ManualPaymentView(APIView):
    """Test endpoint for payment success flow (Swagger testing)"""
    permission_classes = [IsHRAdmin]  
    
    @swagger_auto_schema(
        operation_summary="Test payment success flow",
        operation_description="Simulates a successful payment and triggers the set password email flow",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['participant_id'],
            properties={
                'participant_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the participant to process payment for"
                ),
                'reference': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Optional payment reference"
                )
            }
        ),
        responses={
            200: "Payment processed successfully",
            400: "Invalid request or processing error",
            404: "Participant not found"
        }
    )
    def post(self, request):
        """Test payment success flow"""
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response(
                {"error": "participant_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        result = handle_payment_success(
            participant_id=participant_id,
            payment_reference=request.data.get('reference', 'Test payment')
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


# class PaymentWebhookView(APIView):
#     """Handle payment webhooks from payment provider"""
#     permission_classes = [AllowAny]  
    
#     def post(self, request):
#         """Process payment webhook"""
#         # Extract data from webhook
#         payment_data = request.data
        
        
#         if 'participant_id' not in payment_data:
#             return Response(
#                 {"error": "Missing participant_id"}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
            
#         # Check payment status
#         payment_status = payment_data.get('status', '').lower()
#         if payment_status == 'success' or payment_status == 'completed':
#             # Process successful payment
#             result = handle_payment_success(
#                 participant_id=payment_data['participant_id'],
#                 payment_reference=payment_data.get('reference')
#             )
            
#             if result['success']:
#                 return Response(result, status=status.HTTP_200_OK)
#             else:
#                 return Response(result, status=status.HTTP_400_BAD_REQUEST)
#         else:
#             # Handle failed payment if needed
#             return Response(
#                 {"message": f"Payment status '{payment_status}' not processed"}, 
#                 status=status.HTTP_200_OK
#             )


# class PaymentConfirmationView(APIView):
#     """Allow HR Admins to manually confirm payments"""
#     permission_classes = [IsAuthenticated, IsHRAdmin]
    
#     def post(self, request):
#         """Manually confirm payment for a participant"""
#         participant_id = request.data.get('participant_id')
        
#         if not participant_id:
#             return Response(
#                 {"error": "participant_id is required"}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
            
#         result = handle_payment_success(
#             participant_id=participant_id,
#             payment_reference=request.data.get('reference', 'Manual confirmation')
#         )
        
#         if result['success']:
#             return Response(result, status=status.HTTP_200_OK)
#         else:
#             return Response(result, status=status.HTTP_400_BAD_REQUEST)


