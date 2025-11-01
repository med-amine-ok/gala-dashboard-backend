from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ParticipantRegistrationView, 
    ParticipantViewSet, 
    ParticipantProfileView,
    ParticipantProfileUpdateView,
    ParticipantManualyRegistrationView,
    FeedbackView,
    link_participant,
    unlink_participant,
    list_linked_participants,
    upload_image,
    get_participant_images,
    delete_image,
    delete_all_images
)

router = DefaultRouter()
# Only using ViewSet for read-only admin operations
router.register(r'view', ParticipantViewSet, basename='participant-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', ParticipantRegistrationView.as_view(), name='participant-register'),
    path('profile/', ParticipantProfileView.as_view(), name='participant-profile'),
    path('profile/update/', ParticipantProfileUpdateView.as_view(), name='participant-profile-update'),
    path('manual-register/', ParticipantManualyRegistrationView.as_view(), name='participant-manual-register'),
    path('feedback/', FeedbackView.as_view(), name='participant-feedback'),
    path('upload-image/', upload_image, name='upload-participant-image'),
    path('participant-images/', get_participant_images, name='get-participant-images'),
    path('delete-image/<int:image_id>/', delete_image, name='delete-participant-image'),
    path('delete-all-images/', delete_all_images, name='delete-all-participant-images'),
    path('link-participant/<int:participant_id>/', link_participant, name='link-participant'),
    path('unlink-participant/<int:participant_id>/', unlink_participant, name='unlink-participant'),
    path('linked-participants/', list_linked_participants, name='list-linked-participants'),
]