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
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from accounts.permissions import IsHRAdmin , IsCompany, IsCompanyWithProfile,IsHRAdminOrReadOnly
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
    permission_classes = [IsHRAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['field']  
    search_fields = ['name', 'email', 'website']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def create(self, request, *args, **kwargs):
        """Create a company together with a NEW login account for it.
        An email that already belongs to any account is refused, so HR can
        never turn a participant or an admin into a company by mistake.
        Name uniqueness is checked by CompanySerializer (create and update)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = (serializer.validated_data.get('password') or '').strip()

        if CustomUser.objects.filter(email__iexact=email).exists():
            return Response(
                {"email": ["An account already uses this email. Use a dedicated company email."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if password:
            try:
                validate_password(password)
            except DjangoValidationError as exc:
                return Response({"password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                email=email,
                username=email,
                password=password or None,
                role=CustomUser.Role.COMPANY,
                is_active=True,
                password_set=bool(password),
            )
            company = serializer.save(user=user)
        return Response(self.get_serializer(company).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Enhanced statistics about companies for dashboard"""
        total_companies = Company.objects.count()
        
        try:
            companies_with_participants = Company.objects.annotate(
                participant_count=Count('participant_links')
            ).order_by('-participant_count', 'name')[:10]
            
            top_companies = [
                {
                    'id': company.id,
                    'name': company.name,
                    'field': company.field or 'Corporate Partner',
                    'website': company.website or '',
                    'participant_count': company.participant_count
                }
                for company in companies_with_participants
            ]
        except Exception:
            top_companies = [
                {
                    'id': company.id,
                    'name': company.name,
                    'field': company.field or 'Corporate Partner',
                    'website': company.website or '',
                    'participant_count': 0
                }
                for company in Company.objects.all()[:10]
            ]

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
    # Public endpoint: never look at the Authorization header, so a stale or
    # foreign token saved in the browser can't block it ("token not valid")
    authentication_classes = []
    
    def get(self, request, format=None):
        """Return only active companies with minimal data for dropdowns"""
        companies = Company.objects.values('id', 'name')
        return Response(list(companies), status=status.HTTP_200_OK)


class CompanyDetailPublicView(APIView):
    """Public view to get company details for participant registration"""
    permission_classes = [AllowAny]
    # Public endpoint: never look at the Authorization header, so a stale or
    # foreign token saved in the browser can't block it ("token not valid")
    authentication_classes = []
    
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
        serializer = CompanyProfileSerializer(request.user.company_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsCompanyWithProfile])
def link_participant(request, participant_id):
    """
    A company collects a participant's contact (e.g. by scanning their QR code).
    Only approved participants can be collected.
    """
    company = request.user.company_profile
    participant = get_object_or_404(Participant, id=participant_id, status=Participant.Status.APPROVED)

    link, created = CompanyParticipantLink.objects.get_or_create(company=company, participant=participant)
    if not created:
        return Response({'message': 'This participant is already linked to your company.'},
                        status=status.HTTP_200_OK)

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
    link = CompanyParticipantLink.objects.filter(
        company=company, participant_id=participant_id,
    ).select_related('participant__user').first()
    if not link:
        return Response({'error': 'This participant is not linked to your company.'},
                        status=status.HTTP_404_NOT_FOUND)
    name = link.participant.full_name
    link.delete()
    return Response({
        'message': f'Successfully unlinked participant {name} from {company.name}'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsCompanyWithProfile])
def list_linked_participants(request):
    """
    Returns a list of participants linked to the company.
    """
    company = request.user.company_profile

    # Get all links for this company
    links = CompanyParticipantLink.objects.filter(company=company).select_related('participant__user')
    
    participants = []
    for link in links:
        participant = link.participant
        participants.append({
            'id': participant.id,
            'name': participant.full_name,
            'email': participant.email,
            'field_of_study': participant.field_of_study,
            'university': participant.university,
            # 'has_cv': bool(participant.cv_file),
            'linked_at': link.created_at
        })
    
    return Response({
        'company': company.name,
        'linked_participants_count': len(participants),
        'linked_participants': participants
    }, status=status.HTTP_200_OK)