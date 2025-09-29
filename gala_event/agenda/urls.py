from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgendaViewSet, AgendaPublicView , SpeakerRegistrationView 

router = DefaultRouter()
router.register(r'agenda', AgendaViewSet, basename='agenda')

urlpatterns = [
    path('', include(router.urls)),
    path('agenda/public/', AgendaPublicView.as_view(), name='agenda-public'),
    path('speaker-registration/', SpeakerRegistrationView.as_view(), name='speaker-registration'),
]