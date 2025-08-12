import random
import string
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .models import CustomUser, Role, Permission
from .serializers import (
    LoginSerializer,
    RequestOTPSerializer,
    ResetPasswordSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
    RoleSerializer,
    RoleCreateSerializer,
    PermissionSerializer,
    UserSerializer,
    UserCreateSerializer,
    CustomTokenObtainPairSerializer,
)

class HasPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        page = getattr(view, 'page_name', view.__class__.__name__.lower().replace('view', ''))
        action = 'can_view' if request.method == 'GET' else 'can_add' if request.method == 'POST' else 'can_edit' if request.method in ['PUT', 'PATCH'] else 'can_delete' if request.method == 'DELETE' else None
        if not action:
            return False
        return Permission.objects.filter(
            role=request.user.role,
            page=page,
            **{action: True}
        ).exists()

def has_permission(user, page, action):
    """
    Custom function to check if a user has permission for a given page and action.
    """
    if user.is_superuser or (user.role and user.role.name == "Superadmin"):
        return True
    if not user.role:
        return False
    try:
        permission = Permission.objects.filter(
            role=user.role, page=page, **{f"can_{action}": True}
        ).exists()
        return permission
    except Permission.DoesNotExist:
        return False

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)

            if user is not None:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = CustomUser.objects.get(email=email)
                otp = "".join(random.choices(string.digits, k=6))
                user.otp = otp
                user.save()
                send_mail(
                    subject="Your OTP for Password Reset",
                    message=f"Your OTP is {otp}. It is valid for 10 minutes.",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response(
                    {"message": "OTP sent to your email"}, status=status.HTTP_200_OK
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]
            new_password = serializer.validated_data["new_password"]
            try:
                user = CustomUser.objects.get(email=email)
                if user.otp == otp:
                    user.set_password(new_password)
                    user.otp = None
                    user.save()
                    return Response(
                        {"message": "Password reset successfully"},
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = ProfileSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleView(APIView):
    permission_classes = [HasPermission]
    page_name = 'roles'

    def get(self, request):
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RoleCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            role = Role.objects.get(pk=pk)
            if role != request.user.role and not request.user.is_superuser:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            serializer = RoleSerializer(role)
            return Response(serializer.data)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if not has_permission(request.user, 'roles', 'edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            serializer = RoleSerializer(role, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not has_permission(request.user, 'roles', 'delete'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role = Role.objects.get(pk=pk)
            role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Role.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

class PermissionView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'

    def post(self, request):
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PermissionListView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'

    def get(self, request):
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

class PermissionDetailView(APIView):
    permission_classes = [HasPermission]
    page_name = 'permissions'

    def put(self, request, pk):
        try:
            permission = Permission.objects.get(pk=pk)
            serializer = PermissionSerializer(permission, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Permission.DoesNotExist:
            return Response({'error': 'Permission not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            permission = Permission.objects.get(pk=pk)
            permission.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Permission.DoesNotExist:
            return Response({'error': 'Permission not found'}, status=status.HTTP_404_NOT_FOUND)

class UserManagementView(APIView):
    permission_classes = [HasPermission]
    page_name = 'users'

    def get(self, request):
        users = CustomUser.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Only superadmin can create users'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [HasPermission]
    page_name = 'users'

    def get(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)