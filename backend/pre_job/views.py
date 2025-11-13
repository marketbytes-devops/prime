from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import RFQ, Quotation, PurchaseOrder, QuotationTerms
from .serializers import RFQSerializer, QuotationSerializer, PurchaseOrderSerializer, QuotationTermsSerializer
from rest_framework.decorators import action

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
    
    
    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        rfq = self.get_object()
        status = request.data.get('rfq_status')
        
        valid_statuses = [choice[0] for choice in RFQ._meta.get_field('rfq_status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        
        rfq.rfq_status = status
        rfq.save()
        
        serializer = self.get_serializer(rfq)
        return Response(serializer.data)
    
    
    

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rfq_id = self.request.query_params.get('rfq')
        if rfq_id:
            queryset = queryset.filter(rfq=rfq_id)
        return queryset

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

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        quotation = self.get_object()
        status = request.data.get('status')
        not_approved_reason_remark = request.data.get('not_approved_reason_remark')
        
        valid_statuses = [choice[0] for choice in Quotation._meta.get_field('quotation_status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        
        if status == 'Not Approved' and not not_approved_reason_remark:
            return Response({"detail": "Reason is required when setting status to 'Not Approved'"}, status=400)
        
        was_not_approved = quotation.quotation_status == 'Not Approved'
        quotation.quotation_status = status
        if status == 'Not Approved':
            quotation.not_approved_reason_remark = not_approved_reason_remark
        else:
            quotation.not_approved_reason_remark = None
        quotation.save()
        
        if status == 'Not Approved' and not was_not_approved:
            serializer = self.get_serializer(quotation)
            serializer.send_not_approved_notification(quotation, quotation.assigned_sales_person)
        
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
class QuotationTermsViewSet(viewsets.ModelViewSet):
    queryset = QuotationTerms.objects.all()
    serializer_class = QuotationTermsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return super().get_queryset().order_by('-updated_at')[:1]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if qs.exists():
            serializer = self.get_serializer(qs.first())
            return Response(serializer.data)
        return Response({"id": None, "content": "", "updated_at": None})

    @action(detail=False, methods=['patch'], url_path='update')
    def update_terms(self, request):
        if not QuotationTerms.objects.exists():
            return Response(
                {"detail": "No terms exist to update."},
                status=404
            )
        instance = QuotationTerms.objects.first()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        if QuotationTerms.objects.exists():
            return self.update_terms(request)
        return super().create(request, *args, **kwargs)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        quotation_id = self.request.query_params.get('quotation_id')
        if quotation_id:
            queryset = queryset.filter(quotation_id=quotation_id).prefetch_related('items')
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
                while PurchaseOrder.objects.filter(series_number=f"PO-PRIME-{new_sequence:06d}").exists():
                    new_sequence += 1
                po.series_number = f"PO-PRIME-{new_sequence:06d}"
                po.save()
        quotation = instance.quotation
        if not quotation.purchase_orders.exists():
            quotation.quotation_status = 'Approved'
            quotation.save()
        return Response(status=204)

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        purchase_order = self.get_object()
        status = request.data.get('status')
        valid_statuses = [choice[0] for choice in PurchaseOrder._meta.get_field('status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        purchase_order.status = status
        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)