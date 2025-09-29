from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from rest_framework import serializers
from accounts.permissions import IsHRAdmin, IsParticipant
from .models import Agenda , Speaker
from .serializers import AgendaSerializer , SpeakerSerializer, SpeakerRegistrationSerializer
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from django.middleware.csrf import get_token
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class AgendaViewSet(viewsets.ModelViewSet):
    """Full CRUD operations for agenda (HR Admin only)"""

    permission_classes = [IsHRAdmin]
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    @swagger_auto_schema(
        request_body=AgendaSerializer,
        responses={201: AgendaSerializer},
        operation_description="Create an agenda item",
        operation_id="create_agenda_item"
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    queryset = Agenda.objects.all().order_by('start_time')
    serializer_class = AgendaSerializer
    permission_classes = [IsHRAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'place', 'speakers']
    ordering_fields = ['start_time', 'title', 'created_at']
    ordering = ['start_time']

    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_datetime__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_datetime__date__lte=end_date)

        # Filter active/cancelled
        show_cancelled = self.request.query_params.get('show_cancelled', 'false').lower()
        if show_cancelled != 'true':
            queryset = queryset.filter(created_at__date=timezone.now().date())

        return queryset

    def perform_create(self, serializer):
        """Add validation before creating agenda item"""
        self._validate_overlapping_events(serializer.validated_data)
        serializer.save()

    def perform_update(self, serializer):
        """Add validation before updating agenda item"""
        self._validate_overlapping_events(serializer.validated_data, instance=serializer.instance)
        serializer.save()

    def _validate_overlapping_events(self, data, instance=None):
        """Check for overlapping events"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        place = data.get('place')

        if start_datetime and end_datetime and place:
            overlapping_events = Agenda.objects.filter(
                
                is_cancelled=False,
                place=place,  # Same place conflicts
                start_datetime__lt=end_datetime,
                end_datetime__gt=start_datetime
            )

            if instance:
                overlapping_events = overlapping_events.exclude(pk=instance.pk)

            if overlapping_events.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [
                        f"This event overlaps with existing event(s) at {place}: "
                        f"{', '.join([event.title for event in overlapping_events])}"
                    ]
                })

    @action(detail=True, methods=['post'])
    def cancel_event(self, request, pk=None):
        """Cancel a specific event"""
        agenda_item = self.get_object()
        agenda_item.is_cancelled = True
        agenda_item.save()
        
        return Response({
            "message": f"Event '{agenda_item.title}' has been cancelled"
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def activate_event(self, request, pk=None):
        """Activate/reactivate a specific event"""
        agenda_item = self.get_object()
        
        agenda_item.is_cancelled = False
        agenda_item.save()
        
        return Response({
            "message": f"Event '{agenda_item.title}' has been activated"
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Enhanced statistics about agenda for dashboard"""
        total_events = Agenda.objects.count()
        cancelled_events = Agenda.objects.filter(is_cancelled=True).count()

        # Events by type breakdown
        event_types = Agenda.objects.values('event_type').annotate(
            count=Count('event_type')
        ).order_by('-count')


        now = timezone.now()
        # Today's events
        today_events = Agenda.objects.filter(
            start_datetime__date=now.date(),
            
            is_cancelled=False
        ).count()

        # Events by place
        popular_places = Agenda.objects.values('place').annotate(
            count=Count('place')
        ).order_by('-count')[:5]

        return Response({
            'total_events': total_events,
            'status_breakdown': {
                
                'cancelled': cancelled_events,
                'inactive': total_events 
            },
            'event_types': list(event_types),
            'today_events': today_events,
            'popular_places': list(popular_places)
        }, status=status.HTTP_200_OK)


class AgendaPublicView(APIView):
    """Public view of agenda for participants (no authentication required)"""
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Return public agenda items"""
        now = timezone.now()
        
        # Get filter parameters
        event_type = request.query_params.get('event_type')
        date_filter = request.query_params.get('date', 'all')  # all, today, upcoming
        
        # Base queryset - only active and non-cancelled events
        queryset = Agenda.objects.filter(
            is_cancelled=False
        ).order_by('start_datetime')
        
        # Apply filters
        if event_type:
            queryset = queryset.filter(event_type=event_type)
            
        if date_filter == 'today':
            queryset = queryset.filter(start_datetime__date=now.date())
        elif date_filter == 'upcoming':
            queryset = queryset.filter(start_datetime__gte=now)
        elif date_filter == 'current':
            # Current and future events
            queryset = queryset.filter(end_datetime__gte=now)
            
        # Serialize with limited fields for public view
        agenda_data = []
        for agenda in queryset:
            agenda_data.append({
                'id': agenda.id,
                'title': agenda.title,
                'start_datetime': agenda.start_datetime,
                'end_datetime': agenda.end_datetime,
                'place': agenda.place,
                'event_type': agenda.event_type,
                'speakers': agenda.speakers,
                'description': agenda.description
            })
        
        return Response(agenda_data, status=status.HTTP_200_OK)

class SpeakerRegistrationView(APIView):
    
    """Speaker registration endpoint"""
    permission_classes = [IsHRAdmin]
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    @swagger_auto_schema(
        request_body=SpeakerRegistrationSerializer,
        responses={201: SpeakerRegistrationSerializer},
        operation_description="Register a speaker",
        operation_id="register_speaker"
    )

    def post(self, request):
        """Register a speaker"""
        serializer = SpeakerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Speaker registered successfully', 'data': serializer.data}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Get all registered speakers"""
        speakers = Speaker.objects.all()
        serializer = SpeakerSerializer(speakers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)