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
router.register(r'tickets/checkin', TicketCheckInView, basename='ticket-checkin')
router.register(r'tickets/verification', TicketVerificationView, basename='ticket-verification')
router.register(r'tickets/scan-history', TicketScanHistoryView, basename='ticket-scan-history')

urlpatterns = [
    path('', include(router.urls)),
]
