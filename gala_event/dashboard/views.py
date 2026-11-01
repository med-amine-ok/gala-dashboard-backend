from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsHRAdmin
from agenda.models import Agenda
from companies.models import Company
from participants.models import Participant
from participants.services import StatusChangeError, set_status
from tickets.models import Ticket, TicketScan
from .serializers import DashboardParticipantSerializer


def _participant_counts():
    return Participant.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status=Participant.Status.PENDING)),
        approved=Count('id', filter=Q(status=Participant.Status.APPROVED)),
        rejected=Count('id', filter=Q(status=Participant.Status.REJECTED)),
    )


class DashboardOverviewView(APIView):
    """Main dashboard overview with key metrics"""
    permission_classes = [IsHRAdmin]

    def get(self, request):
        now = timezone.now()
        today = timezone.localdate()

        participants = _participant_counts()
        tickets = Ticket.objects.aggregate(
            total=Count('id'),
            checked_in=Count('id', filter=Q(status='checked_in')),
        )
        total_participants = participants['total']
        total_tickets = tickets['total']

        return Response({
            'quick_stats': {
                'total_participants': total_participants,
                'pending_participants': participants['pending'],
                'approved_participants': participants['approved'],
                'total_companies': Company.objects.count(),
                'total_events': Agenda.objects.filter(is_cancelled=False).count(),
                'total_tickets': total_tickets,
                'checked_in_count': tickets['checked_in'],
            },
            'today_metrics': {
                'new_registrations': Participant.objects.filter(registered_at__date=today).count(),
                'approvals_made': Participant.objects.filter(
                    status=Participant.Status.APPROVED, approved_at__date=today,
                ).count(),
                'checkins_completed': TicketScan.objects.filter(
                    scan_datetime__date=today, scan_result='valid',
                ).count(),
                'events_scheduled': Agenda.objects.filter(start_time__date=today, is_cancelled=False).count(),
            },
            'rates': {
                'approval_rate_percentage': round(participants['approved'] / total_participants * 100, 2) if total_participants else 0,
                'checkin_rate_percentage': round(tickets['checked_in'] / total_tickets * 100, 2) if total_tickets else 0,
            },
            'last_updated': now
        }, status=status.HTTP_200_OK)


class DashboardRecentActivityView(APIView):
    """Recent activity feed for dashboard"""
    permission_classes = [IsHRAdmin]

    def get(self, request):
        try:
            limit = max(1, min(int(request.query_params.get('limit', 20)), 100))
        except ValueError:
            limit = 20

        activities = []

        for participant in Participant.objects.select_related('user').order_by('-registered_at')[:10]:
            activities.append({
                'type': 'registration',
                'message': f"New registration: {participant.full_name}",
                'timestamp': participant.registered_at,
                'participant_id': participant.id,
                'status': participant.status
            })

        recent_approvals = Participant.objects.filter(
            status=Participant.Status.APPROVED,
            approved_at__gte=timezone.now() - timedelta(days=7)
        ).select_related('user', 'approved_by').order_by('-approved_at')[:10]
        for participant in recent_approvals:
            activities.append({
                'type': 'approval',
                'message': f"Approved: {participant.full_name}",
                'timestamp': participant.approved_at,
                'participant_id': participant.id,
                'approved_by': participant.approved_by.username if participant.approved_by else 'System'
            })

        recent_scans = TicketScan.objects.filter(
            scan_result='valid'
        ).select_related('ticket__participant__user', 'scanned_by').order_by('-scan_datetime')[:10]
        for scan in recent_scans:
            holder = scan.ticket.participant.full_name if scan.ticket.participant else 'unassigned ticket'
            activities.append({
                'type': 'checkin',
                'message': f"Checked in: {holder}",
                'timestamp': scan.scan_datetime,
                'ticket_number': scan.ticket.serial_number,
                'scanned_by': scan.scanned_by.username
            })

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

        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return Response({
            'activities': activities[:limit],
            'total_activities': len(activities)
        }, status=status.HTTP_200_OK)


class DashboardExportView(APIView):
    """Export dashboard data"""
    permission_classes = [IsHRAdmin]

    def get(self, request):
        export_type = request.query_params.get('type', 'summary')
        if export_type != 'summary':
            return Response({'error': 'Invalid export type'}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'export_date': timezone.now().isoformat(),
            'participants': _participant_counts(),
            'companies': {
                'total': Company.objects.count(),
            },
            'tickets': Ticket.objects.aggregate(
                total=Count('id'),
                active=Count('id', filter=Q(status='active')),
                checked_in=Count('id', filter=Q(status='checked_in')),
            ),
            'events': {
                'total': Agenda.objects.count(),
            }
        }
        return Response(data, status=status.HTTP_200_OK)


class ParticipantTableView(generics.ListAPIView):
    """
    HR dashboard participant table with search, filters and approve / reject.
    """
    permission_classes = [IsHRAdmin]
    serializer_class = DashboardParticipantSerializer
    queryset = Participant.objects.all().select_related('user', 'approved_by')

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'participant_type', 'graduation_year']
    search_fields = ['first_name', 'last_name', 'email', 'user__first_name', 'user__last_name', 'university']
    ordering_fields = ['graduation_year', 'registered_at', 'last_name']
    ordering = ['-registered_at']

    def post(self, request, participant_id):
        """Approve or reject from the table. Same rules as the participants
        endpoints: account activation and emails are handled by set_status."""
        participant = self.get_queryset().filter(id=participant_id).first()
        if participant is None:
            return Response({'error': 'Participant not found'}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            return Response({'error': 'Invalid action. Use "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            set_status([participant.id], action, by=request.user, reason=request.data.get('rejection_reason', ''))
        except StatusChangeError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        participant.refresh_from_db()
        return Response({
            'message': f'Participant {"approved" if action == "approve" else "rejected"} successfully',
            'participant': DashboardParticipantSerializer(participant).data
        })
