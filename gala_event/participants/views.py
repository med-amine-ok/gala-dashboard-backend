from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action, parser_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from cloudinary.uploader import upload as cloudinary_upload
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from accounts.permissions import IsParticipant
from accounts.models import CustomUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count 
from django.db import transaction
from accounts.models import CustomUser
from .serializers import FeedbackSerializer, ParticipantRegistrationSerializer,ParticipantImageSerializer, ParticipantWithImagesSerializer
from accounts.permissions import IsOwnerOrHRAdmin, IsParticipant, IsHRAdmin
from .models import Feedback, Participant, ParticipantImage , ParticipantParticipantLink
from .serializers import (
    ParticipantSerializer,
    ParticipantApprovalSerializer,
    ParticipantBulkApprovalSerializer,
    ParticipantWithTicketSerializer
)
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import qrcode
from io import BytesIO
import base64

class ParticipantProfileView(APIView):
    """
    View for participants to view their own profile.
    Only accessible by authenticated participants.
    """
    permission_classes = [IsAuthenticated, IsParticipant]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        try:
            # Get participant profile for current user
            participant = request.user.participant_profile
            serializer = ParticipantSerializer(participant)
            
            # Get ticket information if available
            ticket_data = None
            if hasattr(participant, 'ticket'):
                ticket = participant.ticket
                
                # # Generate QR code for ticket
                # qr = qrcode.QRCode(
                #     version=1,
                #     error_correction=qrcode.constants.ERROR_CORRECT_L,
                #     box_size=10,
                #     border=4,
                # )
                # qr.add_data(f"TICKET:{ticket.serial_number}")
                # qr.make(fit=True)
                
                # # Create QR code image
                # img = qr.make_image(fill_color="black", back_color="white")
                
                # # Convert to base64
                # buffer = BytesIO()
                # img.save(buffer, format='PNG')
                # img_str = base64.b64encode(buffer.getvalue()).decode()
                
                ticket_data = {
                    'serial_number': ticket.serial_number,
                    'status': ticket.status,
                    'issued_at': ticket.issued_at,
                    # 'qr_code': f'data:image/png;base64,{img_str}',
                }
            
          
                
            # Combine all data
            response_data = serializer.data
            response_data['ticket'] = ticket_data
            
            return Response(response_data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response(
                {"error": "Participant profile not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ParticipantProfileUpdateView(APIView):
    """
    View for participants to update their own profile.
    Only accessible by authenticated participants.
    """
    permission_classes = [IsAuthenticated, IsParticipant]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def put(self, request):
        try:
            participant = request.user.participant_profile
            serializer = ParticipantSerializer(
                participant, 
                data=request.data, 
                partial=True  # Allow partial updates
            )
            
            if serializer.is_valid():
                # Save the updated profile
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except AttributeError:
            return Response(
                {"error": "Participant profile not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Handle PATCH requests same as PUT"""
        return self.put(request)

class ParticipantRegistrationView(APIView):
    # Public endpoint, no authentication required
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register a new participant (public)",
        operation_description="Creates a user account (username=email) and a linked participant profile."
    )
    def post(self, request):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Use transaction to ensure both User and Participant are created together
                with transaction.atomic():
                    participant = serializer.save()
                    return Response({
                        "message": "Thank you for registering! Your account has been created successfully.",
                        "next_steps": [
                            "Your registration is pending admin approval",
                            "You will receive an email notification once approved",
                            "After approval, you can log in using your email and password"
                        ],
                        "status": "PENDING",
                        "email": participant.user.email
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": "Registration failed. Please try again.",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IsHRAdmin(permissions.BasePermission):
    """Permission class for HR Admin operations"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == CustomUser.Role.HR_ADMIN

class IsParticipant(permissions.BasePermission):
    """Permission class for Participant operations"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == CustomUser.Role.PARTICIPANT

class IsOwnerOrHRAdmin(permissions.BasePermission):
    """Permission class - participants can only see their own data, HR can see all"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True  # Let authenticated users through, we'll check object-level permissions
    
    def has_object_permission(self, request, view, obj):
        # HR Admins can access any participant
        if request.user.role == CustomUser.Role.HR_ADMIN:
            return True
        
        # Participants can only access their own profile
        if request.user.role == CustomUser.Role.PARTICIPANT:
            return obj.user == request.user
        
        return False


class ParticipantPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 1000


class ParticipantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only viewset for viewing participants (read-only)
    """
    queryset = Participant.objects.all().select_related('user','ticket')
    serializer_class = ParticipantWithTicketSerializer
    permission_classes = [IsHRAdmin]  # Only HR Admins can manage all participants
    pagination_class = ParticipantPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'participant_type']
    
    # Updated search fields to use User model fields through the relationship
    search_fields = ['user__full_name', 'user__email', 'field_of_study', 'university']
    ordering_fields = ['registered_at', 'status', 'user__full_name']
    ordering = ['-registered_at']  # Default ordering

    def get_serializer_class(self):
        if self.action in ['approve_reject']:
            return ParticipantApprovalSerializer
        return ParticipantWithTicketSerializer

    @action(detail=True, methods=['post'])
    def approve_reject(self, request, pk=None):
        """Approve or reject a participant"""
        participant = self.get_object()
        serializer = ParticipantApprovalSerializer(data=request.data)
        
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            
            if action_type == 'approved':
                participant.status = Participant.Status.APPROVED  # Use the correct enum value
                participant.approved_by = request.user
                participant.user.is_active = True
                participant.approved_at = timezone.now()
                participant.rejection_reason = ''  
                participant.user.save()
                
            elif action_type == 'rejected':
                participant.status = Participant.Status.REJECTED  # Use the correct enum value
                participant.rejection_reason = serializer.validated_data.get('rejection_reason', '')
                participant.user.is_active = False
                participant.approved_by = None
                participant.approved_at = None
                participant.user.save()

            elif action_type == 'pending':
                participant.status = Participant.Status.PENDING  
                participant.user.is_active = True
                participant.user.save()

            participant.save()
            
            return Response({
                "message": f"Participant {action_type}d successfully",
                "participant_id": participant.id,
                "new_status": participant.status,
                "participant_name": f"{participant.user.first_name} {participant.user.last_name}" if participant.user else "Unknown"
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        method='post',
        request_body=ParticipantBulkApprovalSerializer,
        responses={
            200: openapi.Response(
                description="Successful bulk status update",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "message": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Summary of the operation"
                        ),
                        "affected_count": openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="Number of participants updated"
                        ),
                    },
                ),
            ),
            400: openapi.Response(
                description="Validation error",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "participant_ids": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="Validation errors related to the participant_ids field"
                        ),
                        "action": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="Validation errors related to the action field"
                        ),
                        "rejection_reason": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                            description="Validation errors related to the rejection_reason field"
                        ),
                        "error": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Human-readable error message in case of missing IDs"
                        ),
                        "missing_ids": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_INTEGER),
                            description="List of participant IDs that were not found"
                        ),
                    },
                ),
            ),
        },
    )
    @action(detail=False, methods=['post'])
    def bulk_approve_reject(self, request):
        """Bulk approve or reject participants"""
        serializer = ParticipantBulkApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        participant_ids = serializer.validated_data['participant_ids']
        action_type = serializer.validated_data['action']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')

        participants_qs = Participant.objects.filter(id__in=participant_ids)
        found_ids = set(participants_qs.values_list('id', flat=True))
        missing_ids = [participant_id for participant_id in participant_ids if participant_id not in found_ids]

        if missing_ids:
            return Response({
                "error": "Some participant IDs were not found.",
                "missing_ids": missing_ids
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        now = timezone.now()

        with transaction.atomic():
            participants_to_update = participants_qs.select_for_update().prefetch_related('user')
            for participant in participants_to_update:
                user = participant.user

                if action_type == 'approved':
                    participant.status = Participant.Status.APPROVED
                    participant.approved_by = request.user
                    participant.approved_at = now
                    participant.rejection_reason = ''
                    if user:
                        user.is_active = True
                        user.save(update_fields=['is_active'])

                elif action_type == 'rejected':
                    participant.status = Participant.Status.REJECTED
                    participant.rejection_reason = rejection_reason
                    participant.approved_by = None
                    participant.approved_at = None
                    if user:
                        user.is_active = False
                        user.save(update_fields=['is_active'])

                else:  # pending
                    participant.status = Participant.Status.PENDING
                    participant.approved_by = None
                    participant.approved_at = None
                    participant.rejection_reason = ''
                    if user:
                        user.is_active = True
                        user.save(update_fields=['is_active'])

                participant.save()
                updated_count += 1

        return Response({
            "message": f"Bulk {action_type} operation completed successfully",
            "affected_count": updated_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get participant statistics for HR Admin dashboard"""
        total_participants = Participant.objects.count()
        
        # Status counts using correct enum values
        pending_count = Participant.objects.filter(status=Participant.Status.PENDING).count()
        approved_count = Participant.objects.filter(status=Participant.Status.APPROVED).count()
        rejected_count = Participant.objects.filter(status=Participant.Status.REJECTED).count()
        
        # Payment status counts
        paid_count = Participant.objects.filter(payment_status='paid').count()
        pending_payment = Participant.objects.filter(payment_status='pending').count()
        failed_payment = Participant.objects.filter(payment_status='failed').count()
        
        # Participant type counts
        participant_types = Participant.objects.values('participant_type').annotate(
            count=Count('participant_type')
        )
        
        # Recent registrations (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_registrations = Participant.objects.filter(
            registered_at__gte=seven_days_ago
        ).count()
        
        # Today's registrations
        today = timezone.now().date()
        today_registrations = Participant.objects.filter(
            registered_at__date=today
        ).count()
        
        # University distribution (top 5)
        university_distribution = Participant.objects.filter(
            university__isnull=False
        ).exclude(university='').values('university').annotate(
            count=Count('university')
        ).order_by('-count')[:5]
        
        return Response({
            'total_participants': total_participants,
            'status_breakdown': {
                'pending': pending_count,
                'approved': approved_count,
                'rejected': rejected_count
            },
            'payment_breakdown': {
                'paid': paid_count,
                'pending': pending_payment,
                'failed': failed_payment
            },
            'participant_types': list(participant_types),
            'university_distribution': list(university_distribution),
            'recent_registrations_7_days': recent_registrations,
            'today_registrations': today_registrations,
            'approval_rate': round((approved_count / total_participants * 100), 2) if total_participants > 0 else 0,
            'pending_approvals': pending_count  # Useful for HR dashboard
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get only pending participants for approval queue"""
        pending_participants = self.queryset.filter(status=Participant.Status.PENDING)
        serializer = self.get_serializer(pending_participants, many=True)
        return Response({
            'count': pending_participants.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def approved(self, request):
        """Get only approved participants"""
        approved_participants = self.queryset.filter(status=Participant.Status.APPROVED)
        serializer = self.get_serializer(approved_participants, many=True)
        return Response({
            'count': approved_participants.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def rejected(self, request):
        """Get only rejected participants"""
        rejected_participants = self.queryset.filter(status=Participant.Status.REJECTED)
        serializer = self.get_serializer(rejected_participants, many=True)
        return Response({
            'count': rejected_participants.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class ParticipantDetailView(APIView):
    """Allow participants to view their own profile, HR to view any"""
    permission_classes = [IsOwnerOrHRAdmin]
    
    def get(self, request, participant_id=None):
        try:
            if participant_id:
                # HR Admin accessing specific participant
                if request.user.role != CustomUser.Role.HR_ADMIN:
                    return Response(
                        {"error": "Only HR Admins can access other participants' profiles."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                participant = Participant.objects.get(id=participant_id)
            else:
                # Participant accessing their own profile
                if request.user.role != CustomUser.Role.PARTICIPANT:
                    return Response(
                        {"error": "Only participants can access this endpoint."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                # Ensure participant profile exists; create if missing
                participant = getattr(request.user, 'participant_profile', None)
                if participant is None:
                    participant = Participant.objects.create(user=request.user)
            
            serializer = ParticipantSerializer(participant)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Participant.DoesNotExist:
            return Response(
                {"error": "Participant not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": "Unable to retrieve participant data."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ParticipantManualyRegistrationView(APIView):
    """Allow HR Admins to manually register participants"""
    permission_classes = [IsHRAdmin]

    @swagger_auto_schema(
        request_body=ParticipantRegistrationSerializer,
        operation_summary="Register a new participant (public)",
        operation_description="Creates a user account (username=email) and a linked participant profile."
    )
    
    def post(self, request, participant_id=None):
        serializer = ParticipantRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    participant = serializer.save()
                    participant.status = Participant.Status.APPROVED
                    participant.save()
                    return Response({
                        "message": "Participant registered successfully.",
                        "participant_id": participant.id,
                        "email": participant.user.email
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "error": "Registration failed. Please try again.",
                    "details": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class FeedbackView(APIView):
    queryset = Feedback.objects.all().select_related('participant')
    serializer_class = FeedbackSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    @swagger_auto_schema(
        request_body=FeedbackSerializer,
        operation_summary="Submit feedback",
        operation_description="Allows participants to submit feedback for the event."
    )
    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            feedback = serializer.save()
            return Response({
                "message": "Feedback submitted successfully.",
                "feedback_id": feedback.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsParticipant])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """
    Allows an authenticated participant to upload multiple profile images.
    """
    try:
        participant = request.user.participant_profile
        files = request.FILES.getlist('files')  # Support multiple files
        
        if not files:
            return Response(
                {'error': 'No files uploaded.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        uploaded_images = []
        errors = []
        
        for file in files:
            # Validate file extension
            if not any(file.name.lower().endswith(ext) for ext in allowed_extensions):
                errors.append(f"{file.name}: Only image files (JPG, PNG, GIF, WEBP) are allowed.")
                continue
            
            # Validate file size (max 15MB)
            if file.size > 15 * 1024 * 1024:
                errors.append(f"{file.name}: File size exceeds 15MB limit.")
                continue
            
            try:
                # Generate unique public_id
                timestamp = int(timezone.now().timestamp())
                public_id = f"participants/images/image_{participant.id}_{timestamp}_{file.name.split('.')[0]}"
                
                # Upload to Cloudinary
                upload_result = cloudinary_upload(
                    file,
                    public_id=public_id,
                    resource_type='image',
                    overwrite=True,
                    folder=f"participants/images",
                    access_mode='public',
                )
                
                file_url = upload_result.get('url')
                
                # Save to database
                participant_image = ParticipantImage.objects.create(
                    participant=participant,
                    image_url=file_url,
                    cloudinary_public_id=upload_result.get('public_id')
                )
                
                uploaded_images.append({
                    'id': participant_image.id,
                    'file_name': file.name,
                    'file_url': file_url,
                    'uploaded_at': participant_image.uploaded_at
                })
                
            except Exception as e:
                errors.append(f"{file.name}: Upload failed - {str(e)}")
        
        if not uploaded_images and errors:
            return Response(
                {'error': 'No images uploaded successfully', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response_data = {
            'message': f'{len(uploaded_images)} image(s) uploaded successfully',
            'uploaded_images': uploaded_images,
        }
        
        if errors:
            response_data['warnings'] = errors
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except AttributeError:
        return Response(
            {'error': 'Participant profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsParticipant])
def get_participant_images(request, participant_id=None):
    """
    Retrieve all images for a participant.
    - Participants can only view their own images
    - HR admins can view any participant's images
    """
    user = request.user
    
    # If no participant_id provided, get current user's images
    if participant_id is None:
        if not hasattr(user, 'participant_profile'):
            return Response(
                {'error': 'User is not a participant.'},
                status=status.HTTP_403_FORBIDDEN
            )
        participant = user.participant_profile
    else:
        participant = get_object_or_404(Participant, id=participant_id)
    
    # Check permissions
    is_own_profile = hasattr(user, 'participant_profile') and user.participant_profile.id == participant.id
    is_hr_admin = getattr(user, 'role', None) == CustomUser.Role.HR_ADMIN
    
    if not (is_own_profile or is_hr_admin):
        return Response(
            {'error': 'Unauthorized access.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get all images for this participant
    images = participant.images.all()
    
    if not images.exists():
        return Response(
            {
                'message': 'No images uploaded yet.',
                'images': []
            },
            status=status.HTTP_200_OK
        )
    
    serializer = ParticipantImageSerializer(images, many=True)
    
    return Response(
        {
            'participant_id': participant.id,
            'participant_name': participant.full_name,
            'total_images': images.count(),
            'images': serializer.data
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsParticipant])
def delete_image(request, image_id):
    """
    Delete a specific image.
    Participants can only delete their own images, HR admins can delete any.
    """
    try:
        image = get_object_or_404(ParticipantImage, id=image_id)
        user = request.user
        
        # Check permissions
        is_owner = hasattr(user, 'participant_profile') and user.participant_profile.id == image.participant.id
        is_hr_admin = getattr(user, 'role', None) == CustomUser.Role.HR_ADMIN
        
        if not (is_owner or is_hr_admin):
            return Response(
                {'error': 'Unauthorized access.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete from Cloudinary
        try:
            from cloudinary.api import delete_resources
            delete_resources([image.cloudinary_public_id])
        except Exception as e:
            # Log but don't fail if Cloudinary deletion fails
            print(f"Warning: Failed to delete from Cloudinary: {str(e)}")
        
        # Delete from database
        image.delete()
        
        return Response(
            {'message': 'Image deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsParticipant])
def delete_all_images(request):
    """
    Delete all images for the authenticated participant.
    """
    try:
        participant = request.user.participant_profile
        images = participant.images.all()
        
        if not images.exists():
            return Response(
                {'message': 'No images to delete.'},
                status=status.HTTP_200_OK
            )
        
        # Delete all from Cloudinary
        try:
            from cloudinary.api import delete_resources
            public_ids = [img.cloudinary_public_id for img in images]
            if public_ids:
                delete_resources(public_ids)
        except Exception as e:
            print(f"Warning: Failed to delete from Cloudinary: {str(e)}")
        
        deleted_count = images.count()
        images.delete()
        
        return Response(
            {
                'message': f'{deleted_count} image(s) deleted successfully',
                'deleted_count': deleted_count
            },
            status=status.HTTP_200_OK
        )
        
    except AttributeError:
        return Response(
            {'error': 'Participant profile not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsParticipant])
def link_participant(request, participant_id):
    """
    Allows a participant to link with a participant .
    """
    current_participant = request.user.participant_profile
    participant = get_object_or_404(Participant, id=participant_id)
    
    # Check if link already exists
    if ParticipantParticipantLink.objects.filter(current_participant=current_participant, participant=participant).exists():
        return Response({'message': 'This participant is already linked to your profile.'}, 
                       status=status.HTTP_200_OK)
    
    # Create the link
    link = ParticipantParticipantLink.objects.create(current_participant=current_participant, participant=participant)
    
    return Response({
        'message': f'Successfully linked participant {participant.full_name} to {current_participant.full_name}',
        'link_id': link.id,
        'created_at': link.created_at
    }, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsParticipant])
def unlink_participant(request, participant_id):
    """
    Allows a participant to unlink with another participant.
    """
    current_participant = request.user.participant_profile
    participant = get_object_or_404(Participant, id=participant_id)
    
    # Find and delete the link
    link = ParticipantParticipantLink.objects.filter(current_participant=current_participant, participant=participant).first()

    if not link:
        return Response({'error': 'This participant is not linked to you.'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    link.delete()
    
    return Response({
        'message': f'Successfully unlinked participant {participant.full_name} from {current_participant.full_name}'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsParticipant])
def list_linked_participants(request):
    """
    Returns a list of participants linked to the current participant.
    """
    current_participant = request.user.participant_profile

    links = ParticipantParticipantLink.objects.filter(current_participant=current_participant).select_related('participant')
    
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
            'linkedin_url': participant.linkedin_url,
            'linked_at': link.created_at
        })
    
    return Response({
        'message': 'List of linked participants.',
        'linked_participants_count': len(participants),
        'linked_participants': participants
    }, status=status.HTTP_200_OK)