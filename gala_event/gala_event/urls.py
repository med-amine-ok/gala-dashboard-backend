from django.contrib import admin
from django.urls import include, path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.urls import re_path
from rest_framework.permissions import AllowAny
from gala_event import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)



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
    path("api/accounts/", include("accounts.urls")),
    path("api/participants/", include("participants.urls")),
    path("api/", include("tickets.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/", include("companies.urls")),
    # path("api/", include("agenda.urls")),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
