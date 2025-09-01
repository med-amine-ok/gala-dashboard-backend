from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParticipantRegistrationView, ParticipantViewSet, ParticipantDetailView

router = DefaultRouter()
router.register(r'participants', ParticipantViewSet, basename='participant')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', ParticipantRegistrationView.as_view(), name='participant-register'),
    # Note: ParticipantDetailView is now accessed through the ViewSet
    # Individual participant access: /api/participants/{id}/ (handled by ViewSet)
    # Or if you want a separate endpoint for participants to access their own profile:
    path('my-profile/', ParticipantDetailView.as_view(), name='my-participant-profile'),
]