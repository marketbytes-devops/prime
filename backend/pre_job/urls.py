from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQViewSet 

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfq')

urlpatterns = [
    path('', include(router.urls)),
]
