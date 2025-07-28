from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkOrder, DeliveryNote
from .serializers import WorkOrderSerializer, DeliveryNoteSerializer
from django.utils import timezone

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=True, methods=['post'])
    def move_to_approval(self, request, pk=None):
        work_order = self.get_object()
        if all(item.certificate_number and item.calibration_due_date for item in work_order.items.all()):
            work_order.status = 'Manager Approval'
            work_order.save()
            return Response({'status': 'Work Order moved to Manager Approval'})
        return Response({'error': 'All items must have certificate number and calibration due date'}, status=400)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status == 'Manager Approval':
            work_order.manager_approval_status = 'Approved'
            work_order.status = 'Approved'
            work_order.save()
            
            # Create Delivery Note
            try:
                dn_series = NumberSeries.objects.get(series_name='DeliveryNote')
            except NumberSeries.DoesNotExist:
                return Response({'error': 'Delivery Note series not found'}, status=400)
            max_sequence = DeliveryNote.objects.filter(dn_number__startswith=dn_series.prefix).aggregate(
                Max('dn_number')
            )['dn_number__max']
            sequence = 1
            if max_sequence:
                sequence = int(max_sequence.split('-')[-1]) + 1
            dn_number = f"{dn_series.prefix}-{sequence:06d}"

            DeliveryNote.objects.create(
                work_order=work_order,
                dn_number=dn_number,
                delivery_status='Delivery Pending'
            )
            return Response({'status': 'Work Order approved and Delivery Note created'})
        return Response({'error': 'Work Order must be in Manager Approval status'}, status=400)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        work_order = self.get_object()
        decline_reason = request.data.get('decline_reason')
        if work_order.status == 'Manager Approval' and decline_reason:
            work_order.manager_approval_status = 'Declined'
            work_order.status = 'Declined'
            work_order.decline_reason = decline_reason
            work_order.save()
            return Response({'status': 'Work Order declined'})
        return Response({'error': 'Work Order must be in Manager Approval status and decline reason is required'}, status=400)

class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'])
    def upload_signed_note(self, request, pk=None):
        delivery_note = self.get_object()
        signed_delivery_note = request.FILES.get('signed_delivery_note')
        if signed_delivery_note:
            delivery_note.signed_delivery_note = signed_delivery_note
            delivery_note.delivery_status = 'Delivered'
            delivery_note.save()
            work_order = delivery_note.work_order
            work_order.status = 'Delivered'
            work_order.save()
            return Response({'status': 'Signed Delivery Note uploaded and status updated'})
        return Response({'error': 'Signed Delivery Note is required'}, status=400)