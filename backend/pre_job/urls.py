from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, QuotationViewSet

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfq')
router.register(r'quotations', QuotationViewSet, basename='quotation')

urlpatterns = [
    path('', include(router.urls)),
]