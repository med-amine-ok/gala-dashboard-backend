from django.contrib import admin
from django.urls import include, path 


urlpatterns = [
    path("admin/", admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path("api/accounts/", include("accounts.urls")),
    path("api/participants/", include("participants.urls")),
    path("api/tickets/", include("tickets.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/companies/", include("companies.urls")),
    path("api/agenda/", include("agenda.urls")),
]
