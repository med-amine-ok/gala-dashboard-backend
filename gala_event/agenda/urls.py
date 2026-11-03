from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgendaViewSet, AgendaPublicView

router = DefaultRouter()
router.register(r'agenda', AgendaViewSet, basename='agenda')

# The explicit path must come BEFORE the router, otherwise its detail route
# `agenda/<pk>/` swallows `agenda/public/` (same issue as tickets/checkin/).
urlpatterns = [
    path('agenda/public/', AgendaPublicView.as_view(), name='agenda-public'),
    path('', include(router.urls)),
]