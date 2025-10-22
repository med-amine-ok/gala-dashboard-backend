from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ( CompanyViewSet,
    CompanyListView, 
    CompanyDetailPublicView, 
    CompanyProfileView,
    link_participant,
    unlink_participant,
    list_linked_participants 
)


router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
    path('companies/list/', CompanyListView.as_view(), name='company-list'),
    path('companies/public/<int:pk>/', CompanyDetailPublicView.as_view(), name='company-detail'),
    path('companies/profile/', CompanyProfileView.as_view(), name='company-profile'),
    path('companies/link-participant/<int:participant_id>/', link_participant, name='link-participant'),
    path('companies/unlink-participant/<int:participant_id>/', unlink_participant, name='unlink-participant'),
    path('companies/linked-participants/', list_linked_participants, name='list-linked-participants'),
]