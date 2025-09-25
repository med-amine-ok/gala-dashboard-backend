from django.urls import path , include
from .views import (
    DashboardOverviewView,
    DashboardRecentActivityView,
    DashboardExportView,
    ParticipantTableView
)

urlpatterns = [
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('recent-activity/', DashboardRecentActivityView.as_view(), name='dashboard-recent-activity'),
    path('export/', DashboardExportView.as_view(), name='dashboard-export'),
    path('participants-table/', ParticipantTableView.as_view(), name='participants-table'),
    path('participants-table/<int:participant_id>/action/', ParticipantTableView.as_view(), name='participant-action'),
]