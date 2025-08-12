from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    RequestOTPView,
    ResetPasswordView,
    ProfileView,
    ChangePasswordView,
    RoleView,
    RoleDetailView,
    PermissionView,
    PermissionListView,
    PermissionDetailView,
    UserManagementView,
    UserDetailView,
    CustomTokenObtainPairView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("request-otp/", RequestOTPView.as_view(), name="request_otp"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("roles/", RoleView.as_view(), name="role_list"),
    path("roles/<int:pk>/", RoleDetailView.as_view(), name="role_detail"),
    path("permissions/", PermissionView.as_view(), name="permission_create"),
    path("permissions/list/", PermissionListView.as_view(), name="permission_list"),
    path("permissions/<int:pk>/", PermissionDetailView.as_view(), name="permission_detail"),
    path("users/", UserManagementView.as_view(), name="user_management"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
]