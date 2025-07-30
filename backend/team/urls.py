from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamMemberViewSet,TechnicianViewSet

router = DefaultRouter()
router.register(r'teams', TeamMemberViewSet)
router.register(r'technicians', TechnicianViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
]