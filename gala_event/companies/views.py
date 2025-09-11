from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from accounts.permissions import IsHRAdmin, IsOwnerOrHRAdmin
from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    """Full CRUD operations for companies (HR Admin only)"""
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsHRAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['field']  
    search_fields = ['name', 'email', 'website']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def create(self, request, *args, **kwargs):
        """Override create to handle duplicate company names gracefully"""
        name = request.data.get('name', '').strip()
        if not name:
            return Response(
                {"error": "Company name is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Company.objects.filter(name__iexact=name).exists():
            return Response(
                {"error": "Company with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Override update to handle name uniqueness"""
        instance = self.get_object()
        name = request.data.get('name', '').strip()
        
        if name and name.lower() != instance.name.lower():
            if Company.objects.filter(name__iexact=name).exists():
                return Response(
                    {"error": "Company with this name already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Enhanced statistics about companies for dashboard"""
        total_companies = Company.objects.count()
        

        # Companies with most participants (if you have participants app)
        try:
            from participants.models import Participant
            companies_with_participants = Company.objects.annotate(
                participant_count=Count('participants')
            ).filter(participant_count__gt=0).order_by('-participant_count')[:5]
            
            top_companies = [
                {
                    'name': company.name,
                    'participant_count': company.participant_count
                }
                for company in companies_with_participants
            ]
        except ImportError:
            top_companies = []

        

        return Response({
            'total_companies': total_companies,
            'top_companies_by_participants': top_companies,
            
            
            'completion_rate': {
                'with_website': Company.objects.exclude(website__isnull=True).exclude(website__exact='').count(),
                
            }
        }, status=status.HTTP_200_OK)


class CompanyListView(APIView):
    """Public list of active companies for participant registration dropdown"""
    permission_classes = [AllowAny]  # Public access for registration form
    
    def get(self, request, format=None):
        """Return only active companies with minimal data for dropdowns"""
        companies = Company.objects.values('id', 'name')
        return Response(list(companies), status=status.HTTP_200_OK)


class CompanyDetailPublicView(APIView):
    """Public view to get company details for participant registration"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk, format=None):
        """Get specific company details for registration form"""
        try:
            company = Company.objects.get(pk=pk)
            data = {
                'id': company.id,
                'name': company.name,
                'description': company.description,
                'website': company.website,
                
            }
            return Response(data, status=status.HTTP_200_OK)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )