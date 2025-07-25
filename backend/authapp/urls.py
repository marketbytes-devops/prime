from django.urls import path
from .views import (
    LoginView,
    RequestOTPView,
    ResetPasswordView,
    ProfileView,
    ChangePasswordView,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("request-otp/", RequestOTPView.as_view(), name="request_otp"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
