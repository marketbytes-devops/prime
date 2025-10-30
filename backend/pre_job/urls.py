from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, QuotationViewSet, PurchaseOrderViewSet, QuotationTermsViewSet

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfq')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'quotation-terms', QuotationTermsViewSet, basename='quotation-terms')

urlpatterns = [
    path('', include(router.urls)),
]