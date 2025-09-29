from django.urls import path 
from rest_framework_simplejwt import views as jwt_views
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    CheckAuthView,
    SetPasswordView,
    CSRFTokenView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
    path('csrf_token/', CSRFTokenView.as_view(), name='csrf_token'),
    path('check_auth/', CheckAuthView.as_view(), name='check_auth'),
    path('set-password/', SetPasswordView.as_view(), name='set_password'), 
]
