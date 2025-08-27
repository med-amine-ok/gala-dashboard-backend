from django.urls import path
from .views import LoginView, LogoutView, CurrentUserView, CSRFTokenView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
    path('csrf_token/', CSRFTokenView.as_view(), name='csrf_token'),
]