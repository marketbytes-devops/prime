from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, DeliveryNoteViewSet, DeliveryNoteItemComponentViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'delivery-notes', DeliveryNoteViewSet)
router.register(r'delivery-note-item-components', DeliveryNoteItemComponentViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]