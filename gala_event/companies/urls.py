from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, CompanyListView, CompanyDetailPublicView

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
    path('list/', CompanyListView.as_view(), name='company-list'),
    path('public/<int:pk>/', CompanyDetailPublicView.as_view(), name='company-detail'),
]