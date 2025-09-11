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
from .models import CustomUser
from .permissions import IsHRAdmin, IsParticipant
from .serializers import (
    CustomUserSerializer, 
    LoginSerializer, 
    ParticipantProfileSerializer
)


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