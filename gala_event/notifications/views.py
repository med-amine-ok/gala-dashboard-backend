from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django.utils import timezone

from accounts.permissions import IsHRAdmin
from .models import EmailLog, Notification, EmailTemplate
from .serializers import (
    EmailLogSerializer,
    EmailLogListSerializer,
    NotificationSerializer,
    NotificationListSerializer,
    SendEmailSerializer
)

class NotificationPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for HR Admins to view email logs.
    """
    queryset = EmailLog.objects.all().select_related('participant', 'template_used', 'sent_by').order_by('-created_at')
    permission_classes = [IsHRAdmin]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'template_used__template_type']
    search_fields = ['recipient_email', 'recipient_name', 'subject', 'body_text']
    ordering_fields = ['created_at', 'sent_at', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmailLogListSerializer
        return EmailLogSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for in-app notifications.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_read', 'notification_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Users can only see their own notifications
        return Notification.objects.filter(recipient=self.request.user).select_related('participant')

    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({
            "message": "Notification marked as read",
            "id": notification.id,
            "is_read": notification.is_read,
            "read_at": notification.read_at
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.count()
        
        now = timezone.now()
        notifications.update(is_read=True, read_at=now)
        
        return Response({
            "message": f"Successfully marked {count} notifications as read",
            "affected_count": count
        }, status=status.HTTP_200_OK)
