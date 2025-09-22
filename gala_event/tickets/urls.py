from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # PaymentConfirmationView,
    TicketViewSet, 
    TicketCheckInView, 
    TicketVerificationView, 
    TicketScanHistoryView,
    # PaymentWebhookView,
    ManualPaymentView
)

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')


urlpatterns = [
    path('', include(router.urls)),
    path('tickets/checkin/', TicketCheckInView.as_view(), name='ticket-checkin'),
    path('tickets/verify/<str:serial_number>/', TicketVerificationView.as_view(), name='ticket-verification'),
    path('tickets/scan-history/', TicketScanHistoryView.as_view(), name='ticket-scan-history'),
    # path('payments/webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    # path('payments/confirm/', PaymentConfirmationView.as_view(), name='payment-confirm'), 
    path('payments/manual/', ManualPaymentView.as_view(), name='manual-payment'),   
]