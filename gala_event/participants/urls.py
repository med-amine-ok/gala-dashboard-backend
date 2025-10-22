from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParticipantRegistrationView, 
    ParticipantViewSet, 
    ParticipantProfileView,
    ParticipantProfileUpdateView,
    ParticipantListView,
    ParticipantManualyRegistrationView,
    FeedbackView,
    upload_cv,
    get_participant_cv,
    delete_cv
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
    path('feedback/', FeedbackView.as_view(), name='participant-feedback'),
    path('upload-cv/', upload_cv, name='upload-cv'),
    path('<int:participant_id>/cv/', get_participant_cv, name='get-participant-cv'),
    path('delete-cv/', delete_cv, name='delete-cv'),
]