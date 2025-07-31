from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, DeliveryNoteViewSet  # Adjust import based on your app structure

router = DefaultRouter()
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'delivery-notes', DeliveryNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]