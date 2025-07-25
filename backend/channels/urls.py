
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQChannelViewSet

router = DefaultRouter()
router.register(r'channels', RFQChannelViewSet)

urlpatterns = [
    path('', include(router.urls)),
]