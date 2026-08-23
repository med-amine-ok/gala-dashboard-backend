from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailLogViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'email-logs', EmailLogViewSet, basename='email-log')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
