from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count 
from .models import Participant
from .serializers import (
    ParticipantRegistrationSerializer, 
    ParticipantSerializer,
    ParticipantApprovalSerializer
)

class ParticipantRegistrationView(APIView):
    permission_classes = [AllowAny]  # Anyone can register

    def post(self, request):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            participant = serializer.save()
            return Response({
                "message": "Registration successful",
                "participant_id": participant.id,
                "registration_id": str(participant.registration_id)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class HRAdminPermission(permissions.BasePermission):
    """Custom permission for HR Admin operations"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        
        if hasattr(request.user, 'can_approve_participants'):
            return request.user.can_approve_participants
        

        return request.user.is_staff

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [HRAdminPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'registration_type', 'payment_status']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['registered_at', 'status', 'first_name']
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
            action = serializer.validated_data['action']
            
            if action == 'approve':
                participant.status = 'approved'
                participant.approved_by = request.user
                participant.approved_at = timezone.now()
                participant.rejection_reason = ''  # Clear any previous rejection reason
                
            elif action == 'reject':
                participant.status = 'rejected'
                participant.rejection_reason = serializer.validated_data.get('rejection_reason', '')
                participant.approved_by = None
                participant.approved_at = None
                
            participant.save()
            
            return Response({
                "message": f"Participant {action}d successfully",
                "participant_id": participant.id,
                "new_status": participant.status
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get participant statistics for dashboard"""
        total_participants = Participant.objects.count()
        
        # Status counts
        pending_count = Participant.objects.filter(status='pending').count()
        approved_count = Participant.objects.filter(status='approved').count()
        rejected_count = Participant.objects.filter(status='rejected').count()
        
        # Payment status counts
        paid_count = Participant.objects.filter(payment_status='paid').count()
        pending_payment = Participant.objects.filter(payment_status='pending').count()
        failed_payment = Participant.objects.filter(payment_status='failed').count()
        
        # Registration type counts
        registration_types = Participant.objects.values('registration_type').annotate(
            count=Count('registration_type')
        )
        
        # Company distribution (top 5)
        company_distribution = Participant.objects.filter(company__isnull=False).values(
            'company__name'
        ).annotate(count=Count('company')).order_by('-count')[:5]
        
        # Recent registrations (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_registrations = Participant.objects.filter(
            created_at__gte=seven_days_ago
        ).count()
        
        # Today's registrations
        today = timezone.now().date()
        today_registrations = Participant.objects.filter(
            created_at__date=today
        ).count()
        
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
            'company_distribution': list(company_distribution),
            'recent_registrations_7_days': recent_registrations,
            'today_registrations': today_registrations,
            'approval_rate': round((approved_count / total_participants * 100), 2) if total_participants > 0 else 0
        }, status=status.HTTP_200_OK)
