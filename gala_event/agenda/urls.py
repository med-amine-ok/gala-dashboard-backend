from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgendaViewSet, AgendaPublicView, AgendaTodayView

router = DefaultRouter()
router.register(r'agenda', AgendaViewSet, basename='agenda')

urlpatterns = [
    path('', include(router.urls)),
    path('public/', AgendaPublicView.as_view(), name='agenda-public'),
    path('today/', AgendaTodayView.as_view(), name='agenda-today'),
    path('api-auth/', include('rest_framework.urls'))
]