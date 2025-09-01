from django.urls import path 
from .views import (
    LoginView, 
    LogoutView, 
    CurrentUserView, 
    ParticipantProfileView, 
    ParticipantProfileUpdateView, 
    CheckAuthView, 
    HRDashboardView,
    CSRFTokenView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
    path('csrf_token/', CSRFTokenView.as_view(), name='csrf_token'),
    path('participant/profile/', ParticipantProfileView.as_view(), name='participant_profile_view'),
    path('participant/profile/update/', ParticipantProfileUpdateView.as_view(), name='participant_profile_update'),
    path('check_auth/', CheckAuthView.as_view(), name='check_auth'),
    path('hr/dashboard/', HRDashboardView.as_view(), name='hr_dashboard'),
]
