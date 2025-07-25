from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import RFQ, Quotation, PurchaseOrder
from .serializers import RFQSerializer, QuotationSerializer, PurchaseOrderSerializer

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('QUO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_rfqs = RFQ.objects.filter(
                series_number__startswith='QUO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for rfq in subsequent_rfqs:
                current_sequence = int(rfq.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                rfq.series_number = f"QUO-PRIME-{new_sequence:06d}"
                rfq.save()
        return Response(status=204)

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('QUO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_quotations = Quotation.objects.filter(
                series_number__startswith='QUO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for quotation in subsequent_quotations:
                current_sequence = int(quotation.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                quotation.series_number = f"QUO-PRIME-{new_sequence:06d}"
                quotation.save()
        return Response(status=204)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        quotation_id = self.request.query_params.get('quotation_id')
        if quotation_id:
            queryset = queryset.filter(quotation_id=quotation_id)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('PO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_pos = PurchaseOrder.objects.filter(
                series_number__startswith='PO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for po in subsequent_pos:
                current_sequence = int(po.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                po.series_number = f"PO-PRIME-{new_sequence:06d}"
                po.save()
        quotation = instance.quotation
        if not quotation.purchase_orders.exists():
            quotation.quotation_status = 'Approved'
            quotation.save()
        return Response(status=204)