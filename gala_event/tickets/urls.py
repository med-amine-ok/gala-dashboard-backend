from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet, 
    TicketCheckInView, 
    TicketVerificationView, 
    TicketScanHistoryView
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')


urlpatterns = [
    path('', include(router.urls)),
    path('checkin/', TicketCheckInView.as_view(), name='ticket-checkin'),
    path('verify/<str:ticket_number>/', TicketVerificationView.as_view(), name='ticket-verification'),
    path('scan-history/', TicketScanHistoryView.as_view(), name='ticket-scan-history'),
]