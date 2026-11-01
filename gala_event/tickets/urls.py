from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TicketViewSet,
    TicketCheckInView,
    TicketVerificationView,
    TicketScanHistoryView,
    ManualPaymentView
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')

# The explicit paths must come BEFORE the router: otherwise its detail route
# `tickets/<pk>/` swallows `tickets/checkin/` and `tickets/scan-history/`.
urlpatterns = [
    path('tickets/checkin/', TicketCheckInView.as_view(), name='ticket-checkin'),
    path('tickets/scan-history/', TicketScanHistoryView.as_view(), name='ticket-scan-history'),
    path('tickets/verify/<str:serial_number>/', TicketVerificationView.as_view(), name='ticket-verification'),
    path('payments/manual/', ManualPaymentView.as_view(), name='manual-payment'),
    path('', include(router.urls)),
]
