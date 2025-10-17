from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParticipantRegistrationView, 
    ParticipantViewSet, 
    ParticipantProfileView,
    ParticipantProfileUpdateView,
    ParticipantListView,
    ParticipantManualyRegistrationView
)

router = DefaultRouter()
# Only using ViewSet for read-only admin operations
router.register(r'admin/view', ParticipantViewSet, basename='participant-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', ParticipantRegistrationView.as_view(), name='participant-register'),
    path('profile/', ParticipantProfileView.as_view(), name='participant-profile'),
    path('profile/update/', ParticipantProfileUpdateView.as_view(), name='participant-profile-update'),
    path('manual-register/', ParticipantManualyRegistrationView.as_view(), name='participant-manual-register'),
]