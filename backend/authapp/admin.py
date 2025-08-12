from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from .models import CustomUser, Role, Permission

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('email',)

class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    list_display = ('email', 'username', 'name', 'role', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role')
    search_fields = ('email', 'username', 'name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'name', 'address', 'phone_number', 'image')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'role')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'name', 'password1', 'password2', 'role', 'is_staff', 'is_active')}
        ),
    )

class PermissionInline(admin.TabularInline):
    model = Permission
    extra = 1

class RoleAdmin(admin.ModelAdmin):
    inlines = [PermissionInline]
    list_display = ('name', 'description')
    search_fields = ('name',)

class PermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'page', 'can_view', 'can_add', 'can_edit', 'can_delete')
    list_filter = ('role', 'page')
    search_fields = ('role__name', 'page')

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Role, RoleAdmin)
admin.site.register(Permission, PermissionAdmin)
