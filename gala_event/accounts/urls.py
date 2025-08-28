from django.urls import path , include
from .views import LoginView, LogoutView, CurrentUserView


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
    # path('csrf_token/', CSRFTokenView.as_view(), name='csrf_token'),
    path('api-auth/', include('rest_framework.urls'))
]