from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from accounts.permissions import IsParticipant
from accounts.models import CustomUser
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count 
from django.db import transaction
from accounts.models import CustomUser
from .serializers import ParticipantRegistrationSerializer
from accounts.permissions import IsOwnerOrHRAdmin, IsParticipant, IsHRAdmin
from .models import Participant
from .serializers import (
    ParticipantSerializer,
    ParticipantApprovalSerializer
)
from drf_yasg.utils import swagger_auto_schema
import qrcode
from io import BytesIO
import base64

class ParticipantProfileView(APIView):
    """
    View for participants to view their own profile.
    Only accessible by authenticated participants.
    """
    permission_classes = [IsAuthenticated, IsParticipant, IsHRAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        try:
            # Get participant profile for current user
            participant = request.user.participant_profile
            serializer = ParticipantSerializer(participant)
            
            # Get ticket information if available
            ticket_data = None
            if hasattr(participant, 'ticket'):
                ticket = participant.ticket
                
                # Generate QR code for ticket
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(f"TICKET:{ticket.serial_number}")
                qr.make(fit=True)
                
                # Create QR code image
                img = qr.make_image(fill_color="black", back_color="white")
                
                # Convert to base64
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                img_str = base64.b64encode(buffer.getvalue()).decode()
                
                ticket_data = {
                    'serial_number': ticket.serial_number,
                    'status': ticket.status,
                    'issued_at': ticket.issued_at,
                    'qr_code': f'data:image/png;base64,{img_str}',
                }
            
            # Get event schedule from agenda 
            event_schedule = []
            try:
                from agenda.models import AgendaItem
                agenda_items = AgendaItem.objects.filter(is_published=True).order_by('start_time')
                for item in agenda_items:
                    event_schedule.append({
                        'title': item.title,
                        'description': item.description,
                        'start_time': item.start_time,
                        'end_time': item.end_time,
                        'location': item.location,
                    })
            except:
                pass
                
            # Combine all data
            response_data = serializer.data
            response_data['ticket'] = ticket_data
            response_data['event_schedule'] = event_schedule
            
            return Response(response_data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response(
                {"error": "Participant profile not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class ParticipantProfileUpdateView(APIView):
    """
    View for participants to update their own profile.
    Only accessible by authenticated participants.
    """
    permission_classes = [IsAuthenticated, IsParticipant]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request):
        try:
            participant = request.user.participant_profile
            serializer = ParticipantSerializer(
                participant, 
                data=request.data, 
                partial=True  # Allow partial updates
            )
            
            if serializer.is_valid():
                # Save the updated profile
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except AttributeError:
            return Response(
                {"error": "Participant profile not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Handle PATCH requests same as PUT"""
        return self.put(request)


class ParticipantRegistrationView(APIView):
    # Public endpoint, no authentication required
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register a new participant (public)",
        operation_description="Creates a user account (username=email) and a linked participant profile."
    )
    def post(self, request):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Use transaction to ensure both User and Participant are created together
                with transaction.atomic():
                    participant = serializer.save()
                    return Response({
                        "message": "Thank you for registering! Your account has been created successfully.",
                        "next_steps": [
                            "Your registration is pending admin approval",
                            "You will receive an email notification once approved",
                            "After approval, you can log in using your email and password"
                        ],
                        "status": "PENDING",
                        "email": participant.user.email
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": "Registration failed. Please try again.",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsHRAdmin(permissions.BasePermission):
    """Permission class for HR Admin operations"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == CustomUser.Role.HR_ADMIN

class IsParticipant(permissions.BasePermission):
    """Permission class for Participant operations"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == CustomUser.Role.PARTICIPANT

class IsOwnerOrHRAdmin(permissions.BasePermission):
    """Permission class - participants can only see their own data, HR can see all"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # Let authenticated users through, we'll check object-level permissions
    
    def has_object_permission(self, request, view, obj):
        # HR Admins can access any participant
        if request.user.role == CustomUser.Role.HR_ADMIN:
            return True
        
        # Participants can only access their own profile
        if request.user.role == CustomUser.Role.PARTICIPANT:
            return obj.user == request.user
        
        return False

class ParticipantListView(generics.ListAPIView):
    """
    HR Admin view for listing approved participants
    """
    queryset = Participant.objects.filter(status=Participant.Status.APPROVED).select_related('user')
    serializer_class = ParticipantSerializer
    permission_classes = [IsHRAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['participant_type']
    search_fields = ['job_title', 'university']
    ordering_fields = ['registered_at']
    ordering = ['-registered_at']

class ParticipantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only viewset for viewing participants (read-only)
    """
    queryset = Participant.objects.all().select_related('user')
    serializer_class = ParticipantSerializer
    permission_classes = [IsHRAdmin]  # Only HR Admins can manage all participants
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'participant_type']
    
    # Updated search fields to use User model fields through the relationship
    search_fields = ['user__full_name', 'user__email', 'job_title', 'university']
    ordering_fields = ['registered_at', 'status', 'user__full_name']
    ordering = ['-registered_at']  # Default ordering

    def get_serializer_class(self):
        if self.action in ['approve_reject']:
            return ParticipantApprovalSerializer
        return ParticipantSerializer

    @action(detail=True, methods=['post'])
    def approve_reject(self, request, pk=None):
        """Approve or reject a participant"""
        participant = self.get_object()
        serializer = ParticipantApprovalSerializer(data=request.data)
        
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            
            if action_type == 'approved':
                participant.status = Participant.Status.APPROVED  # Use the correct enum value
                participant.approved_by = request.user
                participant.user.is_active = True
                participant.approved_at = timezone.now()
                participant.rejection_reason = ''  
                participant.user.save()
                
            elif action_type == 'rejected':
                participant.status = Participant.Status.REJECTED  # Use the correct enum value
                participant.rejection_reason = serializer.validated_data.get('rejection_reason', '')
                participant.user.is_active = False
                participant.approved_by = None
                participant.approved_at = None
                participant.user.save()

            elif action_type == 'pending':
                participant.status = Participant.Status.PENDING  
                participant.user.is_active = True
                participant.user.save()

            participant.save()
            
            return Response({
                "message": f"Participant {action_type}d successfully",
                "participant_id": participant.id,
                "new_status": participant.status,
                "participant_name": f"{participant.user.first_name} {participant.user.last_name}" if participant.user else "Unknown"
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get participant statistics for HR Admin dashboard"""
        total_participants = Participant.objects.count()
        
        # Status counts using correct enum values
        pending_count = Participant.objects.filter(status=Participant.Status.PENDING).count()
        approved_count = Participant.objects.filter(status=Participant.Status.APPROVED).count()
        rejected_count = Participant.objects.filter(status=Participant.Status.REJECTED).count()
        
        # Payment status counts
        paid_count = Participant.objects.filter(payment_status='paid').count()
        pending_payment = Participant.objects.filter(payment_status='pending').count()
        failed_payment = Participant.objects.filter(payment_status='failed').count()
        
        # Participant type counts
        participant_types = Participant.objects.values('participant_type').annotate(
            count=Count('participant_type')
        )
        
        # Recent registrations (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_registrations = Participant.objects.filter(
            registered_at__gte=seven_days_ago
        ).count()
        
        # Today's registrations
        today = timezone.now().date()
        today_registrations = Participant.objects.filter(
            registered_at__date=today
        ).count()
        
        # University distribution (top 5)
        university_distribution = Participant.objects.filter(
            university__isnull=False
        ).exclude(university='').values('university').annotate(
            count=Count('university')
        ).order_by('-count')[:5]
        
        return Response({
            'total_participants': total_participants,
            'status_breakdown': {
                'pending': pending_count,
                'approved': approved_count,
                'rejected': rejected_count
            },
            'payment_breakdown': {
                'paid': paid_count,
                'pending': pending_payment,
                'failed': failed_payment
            },
            'participant_types': list(participant_types),
            'university_distribution': list(university_distribution),
            'recent_registrations_7_days': recent_registrations,
            'today_registrations': today_registrations,
            'approval_rate': round((approved_count / total_participants * 100), 2) if total_participants > 0 else 0,
            'pending_approvals': pending_count  # Useful for HR dashboard
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get only pending participants for approval queue"""
        pending_participants = self.queryset.filter(status=Participant.Status.PENDING)
        serializer = self.get_serializer(pending_participants, many=True)
        return Response({
            'count': pending_participants.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class ParticipantDetailView(APIView):
    """Allow participants to view their own profile, HR to view any"""
    permission_classes = [IsOwnerOrHRAdmin]
    
    def get(self, request, participant_id=None):
        try:
            if participant_id:
                # HR Admin accessing specific participant
                if request.user.role != CustomUser.Role.HR_ADMIN:
                    return Response(
                        {"error": "Only HR Admins can access other participants' profiles."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                participant = Participant.objects.get(id=participant_id)
            else:
                # Participant accessing their own profile
                if request.user.role != CustomUser.Role.PARTICIPANT:
                    return Response(
                        {"error": "Only participants can access this endpoint."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                # Ensure participant profile exists; create if missing
                participant = getattr(request.user, 'participant_profile', None)
                if participant is None:
                    participant = Participant.objects.create(user=request.user)
            
            serializer = ParticipantSerializer(participant)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Participant.DoesNotExist:
            return Response(
                {"error": "Participant not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": "Unable to retrieve participant data."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ParticipantManualyRegistrationView(APIView):
    """Allow HR Admins to manually register participants"""
    permission_classes = [IsHRAdmin]

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register a new participant (public)",
        operation_description="Creates a user account (username=email) and a linked participant profile."
    )
    
    def post(self, request, participant_id=None):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    participant = serializer.save()
                    participant.status = Participant.Status.APPROVED
                    participant.save()
                    return Response({
                        "message": "Participant registered successfully.",
                        "participant_id": participant.id,
                        "email": participant.user.email
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": "Registration failed. Please try again.",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)