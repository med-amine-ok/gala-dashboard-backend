from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParticipantRegistrationView, ParticipantViewSet

router = DefaultRouter()
router.register(r'participants', ParticipantViewSet, basename='participant')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', ParticipantRegistrationView.as_view(), name='participant-register'),
    path('api-auth/', include('rest_framework.urls'))
]