from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import login, logout
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from participants.models import Participant
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, FormParser
from django.middleware.csrf import get_token
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import CustomUser
from .permissions import IsHRAdmin, IsParticipant
from .serializers import (
    CustomUserSerializer, 
    LoginSerializer, 
    ParticipantProfileSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str



class LoginView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    @swagger_auto_schema(
        request_body=LoginSerializer,
        operation_summary="Login",
        operation_description="Authenticate with email (as username) and password."
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            # serializer.validate() stores the authenticated user under 'user'
            user = serializer.validated_data.get('user')
            if user is None:
                return Response({'error': 'Authentication failed.'}, status=status.HTTP_400_BAD_REQUEST)

            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Use the serializer's to_representation to get role info
            response_data = serializer.to_representation({'user': user})
            response_data['access_token'] = access_token
            response_data['refresh_token'] = refresh_token

            return Response({
                "message": "Login successful",
                "data": response_data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            
            refresh_token = request.data.get('refresh_token')
            
            # If no refresh token provided, still allow logout (lenient approach)
            if not refresh_token:
                return Response({
                    "message": "Logout successful"
                }, status=status.HTTP_200_OK)
            
            # Try to blacklist the refresh token
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({
                    "message": "Logout successful"
                }, status=status.HTTP_200_OK)
                
            except TokenError:
                # Token is invalid, malformed, or already blacklisted
                # Still return success because user wants to logout
                return Response({
                    "message": "Logout successful"
                }, status=status.HTTP_200_OK)
                
            except AttributeError:
                # Blacklist method not available (check if rest_framework_simplejwt.token_blacklist is installed)
                return Response({
                    "message": "Logout successful", 
                    "note": "Token blacklisting not available"
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            # For any unexpected errors, still allow logout but log the issue
            # In production, you'd want to log this error for debugging
            return Response({
                "message": "Logout successful"
            }, status=status.HTTP_200_OK)
class CurrentUserView(APIView):
    # HR-only endpoint
    permission_classes = [IsAuthenticated, IsHRAdmin]

    def get(self, request):
        try:
            user = request.user
            serializer = CustomUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Unable to retrieve user data"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ParticipantProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user is a participant
            if request.user.role != CustomUser.Role.PARTICIPANT:
                return Response(
                    {"error": "Only participants can access this endpoint."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if participant profile exists
            if not hasattr(request.user, 'participant_profile'):
                return Response(
                    {"error": "Participant profile not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            participant = request.user.participant_profile
            serializer = ParticipantProfileSerializer(participant)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Unable to retrieve participant profile."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ParticipantProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            # Check if user is a participant
            if request.user.role != CustomUser.Role.PARTICIPANT:
                return Response(
                    {"error": "Only participants can access this endpoint."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if participant profile exists
            if not hasattr(request.user, 'participant_profile'):
                return Response(
                    {"error": "Participant profile not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            participant = request.user.participant_profile
            serializer = ParticipantProfileSerializer(
                participant, 
                data=request.data, 
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": "Unable to update participant profile."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request):
        """Handle PATCH requests the same as PUT for partial updates"""
        return self.put(request)


class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_data = CustomUserSerializer(request.user).data
        return Response({
            "isAuthenticated": True,
            "user": user_data,
            "role": request.user.role,
            "is_participant": request.user.role == CustomUser.Role.PARTICIPANT,
            "is_hr_admin": request.user.role == CustomUser.Role.HR_ADMIN,
        }, status=status.HTTP_200_OK)


class SetPasswordView(APIView):
    """Allow users to set their password using either a token OR an approved email"""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Set password (email or token flow)",
        operation_description=(
            "Set a new password using one of two flows:\n"
            "- Email flow: provide email + password (participant must be APPROVED).\n"
            "- Token flow: provide uid + token + password (from reset link)."
        ),
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='Participant email (email flow)'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format='password', description='New password (min 8 chars)'),
                'uid': openapi.Schema(type=openapi.TYPE_STRING, description='UID from password reset link (token flow)'),
                'token': openapi.Schema(type=openapi.TYPE_STRING, description='Token from password reset link (token flow)'),
            },
            required=['password'],
            example={
                'email': 'participant@example.com',
                'password': 'NewStrongPass1!'
            },
        ),
        responses={
            200: openapi.Response(
                description='Password set successfully; returns JWT tokens',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'access_token': openapi.Schema(type=openapi.TYPE_STRING),
                        'refresh_token': openapi.Schema(type=openapi.TYPE_STRING),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'role': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(description='Invalid request or not approved'),
            403: openapi.Response(description='Forbidden'),
            404: openapi.Response(description='Participant profile not found'),
        }
    )
    def post(self, request):
        """Set password using either:
        - uid + token + password (traditional token flow), or
        - email + password (for already approved participants)
        """
        uid = request.data.get('uid')
        token = request.data.get('token')
        email = request.data.get('email')
        password = request.data.get('password')

        # 1) Email-based flow for approved participants
        if email and password and not (uid or token):
            try:
                user = CustomUser.objects.get(email__iexact=email)
            except CustomUser.DoesNotExist:
                return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

            # Only participants are allowed to use this flow
            if user.role != CustomUser.Role.PARTICIPANT:
                return Response({"error": "Only participants can set password via email."}, status=status.HTTP_403_FORBIDDEN)

            # Participant profile must exist and be approved
            if not hasattr(user, 'participant_profile'):
                return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)

            if user.participant_profile.status != Participant.Status.APPROVED:
                return Response({"error": "Your account is not approved yet."}, status=status.HTTP_400_BAD_REQUEST)

            # Optionally enforce a minimal password rule
            if len(password) < 8:
                return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

            # Set the new password and ensure the user is active
            user.set_password(password)
            if not user.is_active:
                user.is_active = True
            user.save()

            # Issue JWT tokens so the user is logged in immediately
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({
                "success": True,
                "message": "Password set successfully.",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                }
            }, status=status.HTTP_200_OK)

        # 2) Fallback: token-based flow (uid + token + password)
        if not uid or not token or not password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decode the user id
            user_id = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=user_id)

            # Check if the token is valid
            if default_token_generator.check_token(user, token):
                user.set_password(password)
                if not user.is_active:
                    user.is_active = True
                user.save()

                # Issue tokens here as well for consistency
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                return Response({
                    "success": True,
                    "message": "Password set successfully.",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({"error": "Invalid user ID"}, status=status.HTTP_400_BAD_REQUEST)

# CSRF token views
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrfToken': csrf_token}, status=status.HTTP_200_OK)

class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({'csrfToken': csrf_token}, status=status.HTTP_200_OK)