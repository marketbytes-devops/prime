from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    list_display = (
        "email",
        "username",
        "name",
        "phone_number",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_staff", "is_active", "is_superuser")
    search_fields = ("email", "username", "name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {"fields": ("name", "username", "address", "phone_number", "image")},
        ),  # Add image
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "name",
                    "address",
                    "phone_number",
                    "image",
                    "is_active",
                    "is_staff",
                ),  # Add image
            },
        ),
    )
    ordering = ("email",)
    filter_horizontal = (
        "groups",
        "user_permissions",
    )


admin.site.register(CustomUser, CustomUserAdmin)
