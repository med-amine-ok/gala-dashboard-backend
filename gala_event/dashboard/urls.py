from django.urls import path , include
from .views import (
    DashboardOverviewView,
    DashboardAnalyticsView,
    DashboardRecentActivityView,
    DashboardAlertsView,
    DashboardExportView
)

urlpatterns = [
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('recent-activity/', DashboardRecentActivityView.as_view(), name='dashboard-recent-activity'),
    path('alerts/', DashboardAlertsView.as_view(), name='dashboard-alerts'),
    path('export/', DashboardExportView.as_view(), name='dashboard-export'),
    path('api-auth/', include('rest_framework.urls'))
]