from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParticipantRegistrationView, ParticipantViewSet

router = DefaultRouter()
router.register(r'register', ParticipantRegistrationView.as_view(), basename='participant-register')
router.register(r'participants', ParticipantViewSet, basename='participant')

urlpatterns = [
    path('', include(router.urls)),
]