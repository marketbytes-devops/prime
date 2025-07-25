from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NumberSeriesViewSet

router = DefaultRouter()
router.register(r'series', NumberSeriesViewSet, basename='series')

urlpatterns = [
    path('', include(router.urls)),
]