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
from django.contrib.auth.hashers import make_password
from accounts.permissions import IsHRAdmin , IsCompany, IsCompanyWithProfile
from accounts.models import CustomUser
from .models import Company
from .serializers import CompanySerializer
from accounts.serializers import CompanyProfileSerializer
from django.shortcuts import get_object_or_404
from participants.models import Participant
from .models import CompanyParticipantLink
from rest_framework.decorators import api_view, permission_classes
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
        """Override create to handle duplicate company names and set password"""
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        
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
        
        # Validate password if provided
        if password:
            if len(password) < 8:
                return Response(
                    {"error": "Password must be at least 8 characters long."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create or get the user for this company
        try:
            user, created = CustomUser.objects.get_or_create(
                email__iexact=email,
                defaults={
                    'email': email,
                    'username': email,  
                    'role': CustomUser.Role.COMPANY,
                    'is_active': True,
                }
            )
            
            # If user was just created and password provided, set it
            if created and password:
                user.set_password(password)
                user.password_set = True
                user.save()
            elif not created and password:
                # If user exists and new password provided, update it
                user.set_password(password)
                user.password_set = True
                user.save()
            
            # Check if user already has a company profile
            if hasattr(user, 'company_profile'):
                return Response(
                    {"error": "This user already has a company profile."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Add user to request data for serializer - handle both QueryDict and regular dict
            if hasattr(request.data, '_mutable'):
                request.data._mutable = True
                request.data['user'] = user.id
                request.data._mutable = False
            else:
                request.data['user'] = user.id

        except Exception as e:
            return Response(
                {"error": f"Failed to create user: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to create the company
        try:
            response = super().create(request, *args, **kwargs)
            # Ensure the user's role is set to COMPANY (for newly created users or updates)
            if user.role != CustomUser.Role.COMPANY:
                user.role = CustomUser.Role.COMPANY
                user.save()
            return response
        except Exception as e:
            # If company creation failed and user was newly created, delete the user
            if created:
                user.delete()
            return Response(
                {"error": f"Failed to create company: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        

class CompanyProfileView(APIView):
    permission_classes = [IsCompanyWithProfile]

    def get(self, request):
        try:
            company = request.user.company_profile
            serializer = CompanyProfileSerializer(company)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Unable to retrieve company profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

@api_view(['POST'])
@permission_classes([IsCompanyWithProfile])
def link_participant(request, participant_id):
    """
    Allows a company to link a participant to their company.
    """
    company = request.user.company_profile
    participant = get_object_or_404(Participant, id=participant_id)
    
    # Check if link already exists
    if CompanyParticipantLink.objects.filter(company=company, participant=participant).exists():
        return Response({'message': 'This participant is already linked to your company.'}, 
                       status=status.HTTP_200_OK)
    
    # Create the link
    link = CompanyParticipantLink.objects.create(company=company, participant=participant)
    
    return Response({
        'message': f'Successfully linked participant {participant.full_name} to {company.name}',
        'link_id': link.id,
        'created_at': link.created_at
    }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsCompanyWithProfile])
def unlink_participant(request, participant_id):
    """
    Allows a company to unlink a participant from their company.
    """
    company = request.user.company_profile
    participant = get_object_or_404(Participant, id=participant_id)
    
    # Find and delete the link
    link = CompanyParticipantLink.objects.filter(company=company, participant=participant).first()
    
    if not link:
        return Response({'error': 'This participant is not linked to your company.'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    link.delete()
    
    return Response({
        'message': f'Successfully unlinked participant {participant.full_name} from {company.name}'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsCompanyWithProfile])
def list_linked_participants(request):
    """
    Returns a list of participants linked to the company.
    """
    company = request.user.company_profile
    
    # Get all links for this company
    links = CompanyParticipantLink.objects.filter(company=company).select_related('participant')
    
    participants = []
    for link in links:
        participant = link.participant
        participants.append({
            'id': participant.id,
            'name': participant.full_name,
            'email': participant.email,
            'field_of_study': participant.field_of_study,
            'university': participant.university,
            'has_cv': bool(participant.cv_file),
            'linked_at': link.created_at
        })
    
    return Response({
        'company': company.name,
        'linked_participants_count': len(participants),
        'linked_participants': participants
    }, status=status.HTTP_200_OK)
