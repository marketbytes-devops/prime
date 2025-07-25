from rest_framework import serializers
from .models import CustomUser


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        max_length=None, use_url=True, allow_null=True, required=False
    )

    def validate_image(self, value):
        max_size = 5 * 1024 * 1024
        if value and value.size > max_size:
            raise serializers.ValidationError("Image size cannot exceed 5MB.")
        return value

    class Meta:
        model = CustomUser
        fields = ["email", "name", "username", "address", "phone_number", "image"]
        read_only_fields = ["email"]


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data
