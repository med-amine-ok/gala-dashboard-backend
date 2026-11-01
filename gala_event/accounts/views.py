from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from notifications.emails import send_activation_code
from participants.models import Participant
from .models import CustomUser
from .serializers import CustomUserSerializer, LoginSerializer
from .services import DuplicateEmail, check_activation_code, get_user_by_email, issue_activation_code

import logging

logger = logging.getLogger(__name__)


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class LoginView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]
    throttle_scope = 'login'

    @swagger_auto_schema(
        request_body=LoginSerializer,
        operation_summary="Login",
        operation_description="Authenticate with email (as username) and password.",
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'data': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                                'role': openapi.Schema(type=openapi.TYPE_STRING),
                                'role_display': openapi.Schema(type=openapi.TYPE_STRING),
                                'access_token': openapi.Schema(type=openapi.TYPE_STRING),
                                'refresh_token': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(description="Bad request - validation errors"),
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        access_token, refresh_token = _tokens_for(user)

        response_data = serializer.to_representation({'user': user})
        response_data['access_token'] = access_token
        response_data['refresh_token'] = refresh_token
        return Response({"message": "Login successful", "data": response_data}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                # Already invalid or blacklisted: the user is logged out either way
                pass
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response({
            "user": serializer.data,
            "role": user.role,
            "is_participant": user.role == CustomUser.Role.PARTICIPANT,
            "is_hr_admin": user.role == CustomUser.Role.HR_ADMIN,
            "is_company": user.role == CustomUser.Role.COMPANY,
        }, status=status.HTTP_200_OK)


class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = CustomUserSerializer(request.user).data
        return Response({
            "isAuthenticated": True,
            "user": user_data,
        }, status=status.HTTP_200_OK)


def _password_errors(password, user):
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        return " ".join(exc.messages)
    return None


class SetPasswordView(APIView):
    """
    Create the password of an approved participant.

    Email + one-time code flow (mobile app):
      1. POST {email}                     -> 202, a 6-digit code is emailed
      2. POST {email, code, password}     -> 200, password set + JWT tokens
    Token flow (link): POST {uid, token, password} -> 200 + JWT tokens.

    Knowing someone's email is never enough: the code proves inbox access.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'set_password'

    @swagger_auto_schema(
        operation_summary="Set password (email + one-time code, or uid + token)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='6-digit code from the email'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
                'uid': openapi.Schema(type=openapi.TYPE_STRING),
                'token': openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        responses={
            200: 'Password set; returns access_token, refresh_token, user',
            202: 'Code emailed; call again with email + code + password',
            400: 'Invalid request, code or password',
            403: 'Not allowed for this account',
            404: 'Participant profile not found',
        }
    )
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        email = request.data.get('email')
        code = request.data.get('code')
        password = request.data.get('password')

        if uid or token:
            return self._token_flow(uid, token, password)
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = get_user_by_email(email)
        except DuplicateEmail:
            return Response(
                {"error": "Several accounts use this email. Please contact the organisers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user is None:
            return Response({"error": "No registration was found for this email."}, status=status.HTTP_400_BAD_REQUEST)

        problem = self._eligibility_problem(user)
        if problem:
            return problem

        if not code:
            return self._send_code(user)
        return self._confirm_code(user, code, password)

    @staticmethod
    def _eligibility_problem(user):
        if user.role != CustomUser.Role.PARTICIPANT:
            return Response({"error": "Only participants can create an account here."}, status=status.HTTP_403_FORBIDDEN)
        if not hasattr(user, 'participant_profile'):
            return Response({"error": "Participant profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if user.participant_profile.status != Participant.Status.APPROVED:
            return Response({"error": "Your account is not approved yet."}, status=status.HTTP_400_BAD_REQUEST)
        if user.password_set:
            return Response(
                {"error": "This account already has a password. Please log in."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    @staticmethod
    def _send_code(user):
        code, wait = issue_activation_code(user)
        if code is None:
            return Response(
                {"error": f"A code was just sent. Please wait {wait} seconds before asking again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        if not send_activation_code(user, code):
            return Response(
                {"error": "We could not send the code right now. Please try again in a few minutes."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({
            "code_required": True,
            "detail": f"We sent a 6-digit code to {user.email}. Enter it with your new password.",
        }, status=status.HTTP_202_ACCEPTED)

    @staticmethod
    def _confirm_code(user, code, password):
        if not password:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)
        password_problem = _password_errors(password, user)
        if password_problem:
            return Response({"error": password_problem}, status=status.HTTP_400_BAD_REQUEST)
        code_problem = check_activation_code(user, code)
        if code_problem:
            return Response({"error": code_problem}, status=status.HTTP_400_BAD_REQUEST)
        return SetPasswordView._finish(user, password)

    @staticmethod
    def _finish(user, password):
        user.set_password(password)
        user.is_active = True
        user.password_set = True
        user.save()
        access_token, refresh_token = _tokens_for(user)
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

    @staticmethod
    def _token_flow(uid, token, password):
        if not uid or not token or not password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = CustomUser.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({"error": "Invalid user ID"}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        if user.password_set:
            return Response({"error": "Password has already been set."}, status=status.HTTP_403_FORBIDDEN)
        password_problem = _password_errors(password, user)
        if password_problem:
            return Response({"error": password_problem}, status=status.HTTP_400_BAD_REQUEST)
        return SetPasswordView._finish(user, password)


class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)}, status=status.HTTP_200_OK)
