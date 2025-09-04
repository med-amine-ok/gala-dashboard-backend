from django.contrib import admin
from django.urls import include, path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.urls import re_path
from rest_framework.permissions import AllowAny

schema_view = get_schema_view(
    openapi.Info(
        title="GALA API",
        default_version='v1',
        description="API documentation for the GALA project",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="ouldkhaoua.pro@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path("api/", include("accounts.urls")),
    path("api/", include("participants.urls")),
    path("api/", include("tickets.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("companies.urls")),
    path("api/", include("agenda.urls")),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

