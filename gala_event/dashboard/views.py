from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta, datetime
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from participants.models import Participant
from .serializers import DashboardParticipantSerializer
from accounts.permissions import IsHRAdmin
from companies.models import Company
from agenda.models import Agenda
from tickets.models import Ticket, TicketScan
from notifications.models import EmailLog


class DashboardOverviewView(APIView):
    """Main dashboard overview with key metrics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get overview statistics for dashboard home"""
        now = timezone.now()
        today = now.date()
        
        # Quick stats
        total_participants = Participant.objects.count()
        pending_participants = Participant.objects.filter(status='pending').count()
        approved_participants = Participant.objects.filter(status='approved').count()
        total_companies = Company.objects.filter(status='active').count()
        total_events = Agenda.objects.filter(created_at__date=today).count()
        total_tickets = Ticket.objects.count()
        checked_in_count = Ticket.objects.filter(status='checked_in').count()
        
        # Today's metrics
        today_registrations = Participant.objects.filter(registered_at__date=today).count()
        today_approvals = Participant.objects.filter(
            status='approved',
            updated_at__date=today
        ).count()
        today_checkins = TicketScan.objects.filter(
            scan_datetime__date=today,
            scan_result='check_in'
        ).count()
        
        # Today's events
        today_events = Agenda.objects.filter(
            start_time__date=today,
        ).count()
        
        # Approval rate
        approval_rate = 0
        if total_participants > 0:
            approval_rate = round((approved_participants / total_participants) * 100, 2)
        
        # Check-in rate
        checkin_rate = 0
        if total_tickets > 0:
            checkin_rate = round((checked_in_count / total_tickets) * 100, 2)
        
        return Response({
            'quick_stats': {
                'total_participants': total_participants,
                'pending_participants': pending_participants,
                'approved_participants': approved_participants,
                'total_companies': total_companies,
                'total_events': total_events,
                'total_tickets': total_tickets,
                'checked_in_count': checked_in_count
            },
            'today_metrics': {
                'new_registrations': today_registrations,
                'approvals_made': today_approvals,
                'checkins_completed': today_checkins,
                'events_scheduled': today_events
            },
            'rates': {
                'approval_rate_percentage': approval_rate,
                'checkin_rate_percentage': checkin_rate
            },
            'last_updated': now
        }, status=status.HTTP_200_OK)


class DashboardAnalyticsView(APIView):
    """Detailed analytics for dashboard charts and graphs"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics data for dashboard visualization"""
        now = timezone.now()
        
        # Registration trends (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        daily_registrations = []
        
        for i in range(30):
            date = (thirty_days_ago + timedelta(days=i)).date()
            count = Participant.objects.filter(registered_at__date=date).count()
            daily_registrations.append({
                'date': date.isoformat(),
                'registrations': count
            })

        # Status breakdown
        status_breakdown = Participant.objects.values('status').annotate(
            count=Count('status')
        )
        
        # Payment status breakdown
        payment_breakdown = Participant.objects.values('status').annotate(
            count=Count('status')
        )
        
        # Top companies by participants
        top_companies = Company.objects.annotate(
            participant_count=Count('status')
        ).filter(participant_count__gt=0).order_by('-participant_count')[:10]
        
        company_stats = [
            {
                'company_name': company.name,
                'participant_count': company.participant_count
            }
            for company in top_companies
        ]
        
        # Event attendance prediction
        upcoming_events = Agenda.objects.filter(
            start_time__gte=now,
            start_time__lte=now + timedelta(days=7),
        ).order_by('start_time')
        
        event_data = []
        for event in upcoming_events:
            event_data.append({
                'title': event.title,
                'start_time': event.start_time,
                'place': event.place,
                'event_type': event.event_type
            })
        
        # Check-in patterns (hourly for today)
        today_scans = TicketScan.objects.filter(
            scan_datetime__date=now.date(),
            scan_result='check_in'
        )
        
        hourly_checkins = {}
        for hour in range(24):
            hourly_checkins[f"{hour:02d}:00"] = 0
            
        for scan in today_scans:
            hour_key = f"{scan.scan_datetime.hour:02d}:00"
            hourly_checkins[hour_key] += 1
        
        return Response({
            'registration_trends': daily_registrations,
            'status_breakdown': list(status_breakdown),
            'payment_breakdown': list(payment_breakdown),
            'top_companies': company_stats,
            'upcoming_events': event_data,
            'hourly_checkins_today': hourly_checkins
        }, status=status.HTTP_200_OK)


class DashboardRecentActivityView(APIView):
    """Recent activity feed for dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recent activity across all modules"""
        limit = int(request.query_params.get('limit', 20))
        
        activities = []
        
        # Recent registrations
        recent_participants = Participant.objects.order_by('-registered_at')[:10]
        for participant in recent_participants:
            activities.append({
                'type': 'registration',
                'message': f"New registration: {participant.first_name} {participant.last_name}",
                'timestamp': participant.registered_at,
                'participant_id': participant.id,
                'status': participant.status
            })
        
        # Recent approvals
        recent_approvals = Participant.objects.filter(
            status='approved',
            updated_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-updated_at')[:10]
        
        for participant in recent_approvals:
            activities.append({
                'type': 'approval',
                'message': f"Approved: {participant.first_name} {participant.last_name}",
                'timestamp': participant.updated_at,
                'participant_id': participant.id,
                'approved_by': participant.approved_by.username if participant.approved_by else 'System'
            })
        
        # Recent check-ins
        recent_scans = TicketScan.objects.filter(
            scan_result='check_in'
        ).select_related('ticket__participant', 'scanned_by').order_by('-scan_datetime')[:10]
        
        for scan in recent_scans:
            activities.append({
                'type': 'checkin',
                'message': f"Checked in: {scan.ticket.participant.first_name} {scan.ticket.participant.last_name}",
                'timestamp': scan.scanned_at,
                'ticket_number': scan.ticket.ticket_number,
                'scanned_by': scan.scanned_by.username
            })
        
        # Recent companies
        recent_companies = Company.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:5]
        
        for company in recent_companies:
            activities.append({
                'type': 'company',
                'message': f"New company added: {company.name}",
                'timestamp': company.created_at,
                'company_id': company.id
            })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'activities': activities[:limit],
            'total_activities': len(activities)
        }, status=status.HTTP_200_OK)


class DashboardAlertsView(APIView):
    """Dashboard alerts and notifications"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get alerts and important notifications"""
        alerts = []
        
        # Pending approvals alert
        pending_count = Participant.objects.filter(status='pending').count()
        if pending_count > 0:
            alerts.append({
                'type': 'warning',
                'title': 'Pending Approvals',
                'message': f'{pending_count} participants waiting for approval',
                'action_url': '/participants/?status=pending',
                'priority': 'high' if pending_count > 10 else 'medium'
            })
        
        # Approved without tickets
        approved_no_tickets = Participant.objects.filter(
            status='approved',
            ticket__isnull=True
        ).count()
        
        if approved_no_tickets > 0:
            alerts.append({
                'type': 'info',
                'title': 'Missing Tickets',
                'message': f'{approved_no_tickets} approved participants need tickets generated',
                'action_url': '/tickets/generate',
                'priority': 'medium'
            })
        
        # Today's events
        today_events = Agenda.objects.filter(
            start_time__date=timezone.now().date()
        ).count()
        
        if today_events > 0:
            alerts.append({
                'type': 'success',
                'title': "Today's Events",
                'message': f'{today_events} events scheduled for today',
                'action_url': '/agenda/?date=today',
                'priority': 'low'
            })
        
        # Low check-in rate alert
        total_tickets = Ticket.objects.filter(status__in=['active', 'checked_in', 'used']).count()
        checked_in = Ticket.objects.filter(status='checked_in').count()
        
        if total_tickets > 0:
            checkin_rate = (checked_in / total_tickets) * 100
            if checkin_rate < 50 and total_tickets > 10:
                alerts.append({
                    'type': 'warning',
                    'title': 'Low Check-in Rate',
                    'message': f'Only {checkin_rate:.1f}% of participants have checked in',
                    'priority': 'medium'
                })
        
        # System health check
        try:
            # Check if email system is working (if you have email logs)
            recent_emails = EmailLog.objects.filter(
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).count()
            
            if recent_emails == 0:
                alerts.append({
                    'type': 'error',
                    'title': 'Email System',
                    'message': 'No emails sent in the last 24 hours',
                    'priority': 'high'
                })
        except:
            pass  # EmailLog model might not exist yet
        
        return Response({
            'alerts': alerts,
            'alert_count': len(alerts),
            'high_priority_count': len([a for a in alerts if a.get('priority') == 'high'])
        }, status=status.HTTP_200_OK)


class DashboardExportView(APIView):
    """Export dashboard data"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get exportable summary data"""
        export_type = request.query_params.get('type', 'summary')
        
        if export_type == 'summary':
            # Summary export
            data = {
                'export_date': timezone.now().isoformat(),
                'participants': {
                    'total': Participant.objects.count(),
                    'pending': Participant.objects.filter(status='pending').count(),
                    'approved': Participant.objects.filter(status='approved').count(),
                    'rejected': Participant.objects.filter(status='rejected').count(),
                },
                'companies': {
                    'total': Company.objects.count(),
                    'active': Company.objects.filter(status='active').count(),
                },
                'tickets': {
                    'total': Ticket.objects.count(),
                    'active': Ticket.objects.filter(status='active').count(),
                    'checked_in': Ticket.objects.filter(status='checked_in').count(),
                },
                'events': {
                    'total': Agenda.objects.count(),
                    'active': Agenda.objects.filter(start_time__date=timezone.now().date()).count(),
                }
            }
        else:
            data = {'error': 'Invalid export type'}
        
        return Response(data, status=status.HTTP_200_OK)


class ParticipantTableView(generics.ListAPIView):
    """
    View for HR dashboard participant table with approval/rejection functionality
    Includes search and filtering capabilities
    """
    permission_classes = [IsAuthenticated, IsHRAdmin]
    serializer_class = DashboardParticipantSerializer
    queryset = Participant.objects.all().select_related('user', 'approved_by')
    
    # Add filtering and search capabilities
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'participant_type', 'graduation_year']
    search_fields = ['user__first_name', 'user__last_name', 'university']
    ordering_fields = ['graduation_year', 'registered_at', 'user__first_name']
    ordering = ['-registered_at']  # Default ordering

    def post(self, request, participant_id):
        """
        Handle approval/rejection actions for participants
        """
        try:
            participant = self.queryset.get(id=participant_id)
            action = request.data.get('action')
            
            if action == 'approve':
                participant.status = Participant.Status.APPROVED
                participant.approved_by = request.user
                participant.approved_at = timezone.now()
                participant.rejection_reason = ''  # Clear any previous rejection reason
                participant.save()
                
                return Response({
                    'message': 'Participant approved successfully',
                    'participant': DashboardParticipantSerializer(participant).data
                })
            
            elif action == 'reject':
                rejection_reason = request.data.get('rejection_reason')
                if not rejection_reason:
                    return Response(
                        {'error': 'Rejection reason is required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                participant.status = Participant.Status.REJECTED
                participant.rejection_reason = rejection_reason
                participant.approved_by = None
                participant.approved_at = None
                participant.save()
                
                return Response({
                    'message': 'Participant rejected successfully',
                    'participant': DashboardParticipantSerializer(participant).data
                })
            
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Participant.DoesNotExist:
            return Response(
                {'error': 'Participant not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
