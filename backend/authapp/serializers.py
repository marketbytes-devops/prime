from rest_framework import serializers
from .models import CustomUser, Role, Permission
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.mail import send_mail
import random
import string

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

class PermissionSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())

    class Meta:
        model = Permission
        fields = ['id', 'role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions']

class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class ProfileSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        max_length=None, use_url=True, allow_null=True, required=False
    )
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', write_only=True, required=False
    )

    def validate_image(self, value):
        max_size = 5 * 1024 * 1024
        if value and value.size > max_size:
            raise serializers.ValidationError("Image size cannot exceed 5MB.")
        return value

    class Meta:
        model = CustomUser
        fields = ['email', 'name', 'username', 'address', 'phone_number', 'image', 'role', 'role_id']
        read_only_fields = ['email']

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', write_only=True, required=False
    )

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'name', 'role', 'role_id']
        read_only_fields = ['id']

class UserCreateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='role', required=True
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'name', 'role_id']

    def create(self, validated_data):
        password_length = 12
        characters = string.ascii_letters + string.digits + string.punctuation
        random_password = ''.join(random.choice(characters) for _ in range(password_length))

        user = CustomUser(**validated_data)
        user.set_password(random_password)
        user.save()

        subject = 'Your Account Credentials'
        message = (
            f'Hello {user.name},\n\n'
            f'Your account has been created successfully. Here are your login credentials:\n'
            f'Email: {user.email}\n'
            f'Password: {random_password}\n\n'
            f'Please log in and change your password after your first login.\n\n'
            f'Regards,\nYour Team'
        )
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [user.email]

        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )

        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role.name if user.role else None
        return token