from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, DeliveryNoteViewSet

router = DefaultRouter()
router.register(r'work-orders', WorkOrderViewSet, basename='work-order')
router.register(r'delivery-notes', DeliveryNoteViewSet, basename='delivery-note')

urlpatterns = [
    path('', include(router.urls)),
]