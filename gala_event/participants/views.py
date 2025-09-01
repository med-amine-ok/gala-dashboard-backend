from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count 
from django.db import transaction
from accounts.models import CustomUser
from accounts.serializers import ParticipantRegistrationSerializer
from accounts.permissions import IsOwnerOrHRAdmin, IsParticipant, IsHRAdmin
from .models import Participant
from .serializers import (
    ParticipantSerializer,
    ParticipantApprovalSerializer
)
from drf_yasg.utils import swagger_auto_schema

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
                        "message": "Registration successful! You can now login with your email and password.",
                        "participant_id": participant.id,
                        "user_id": participant.user.id,
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

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsHRAdmin]  # Only HR Admins can manage all participants
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'registration_type', 'payment_status', 'participant_type']
    
    # Updated search fields to use User model fields through the relationship
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'job_title', 'university']
    ordering_fields = ['registered_at', 'status', 'user__first_name']
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
            
            if action_type == 'approve':
                participant.status = Participant.Status.APPROVED  # Use the correct enum value
                participant.approved_by = request.user
                participant.approved_at = timezone.now()
                participant.rejection_reason = ''  # Clear any previous rejection reason
                
            elif action_type == 'reject':
                participant.status = Participant.Status.REJECTED  # Use the correct enum value
                participant.rejection_reason = serializer.validated_data.get('rejection_reason', '')
                participant.approved_by = None
                participant.approved_at = None
                
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
        
        # Registration type counts
        registration_types = Participant.objects.values('registration_type').annotate(
            count=Count('registration_type')
        )
        
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
            'registration_types': list(registration_types),
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