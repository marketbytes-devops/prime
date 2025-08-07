from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkOrder, DeliveryNote
from .serializers import WorkOrderSerializer, DeliveryNoteSerializer
from django.db.models import Max 
import logging

logger = logging.getLogger(__name__)

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        purchase_order_id = self.request.query_params.get('purchase_order')
        status = self.request.query_params.get('status')
        if purchase_order_id:
            queryset = queryset.filter(purchase_order_id=purchase_order_id)
        if status:
            if isinstance(status, str) and ',' in status:
                statuses = status.split(',')
                queryset = queryset.filter(status__in=statuses)
            else:
                queryset = queryset.filter(status=status)
        logger.info(f"Queryset filtered: purchase_order={purchase_order_id}, status={status}, count={queryset.count()}")
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            logger.info(f"WorkOrder created: {serializer.data['id']}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            self.perform_update(serializer)
            logger.info(f"WorkOrder {instance.id} updated")
            return Response(serializer.data)
        logger.error(f"Update failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        purchase_order = instance.purchase_order
        self.perform_destroy(instance)
        logger.info(f"WorkOrder {instance.id} deleted")
        
        remaining_work_orders = WorkOrder.objects.filter(purchase_order=purchase_order).count()
        if remaining_work_orders == 0 and purchase_order:
            purchase_order.status = 'Collection Pending'
            purchase_order.save()
            logger.info(f"PurchaseOrder {purchase_order.id} status reset to Collection Pending")
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='move-to-approval')
    def move_to_approval(self, request, pk=None):
        work_order = self.get_object()
        if all(item.certificate_number and item.calibration_due_date for item in work_order.items.all()):
            work_order.status = 'Manager Approval'
            work_order.save()
            logger.info(f"WorkOrder {pk} moved to Manager Approval")
            return Response({'status': 'Work Order moved to Manager Approval'})
        logger.warning(f"WorkOrder {pk} cannot move to approval: missing certificate data")
        return Response({'error': 'All items must have certificate number and calibration due date'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Manager Approval':
            logger.warning(f"WorkOrder {pk} not in Manager Approval status")
            return Response({'error': 'Work Order must be in Manager Approval status'}, status=status.HTTP_400_BAD_REQUEST)

        from series.models import NumberSeries
        try:
            dn_series = NumberSeries.objects.get(series_name='DeliveryNote')
        except NumberSeries.DoesNotExist:
            logger.error("Delivery Note series not found, using default prefix 'DN'")
            dn_series = None 

        max_sequence = DeliveryNote.objects.filter(dn_number__startswith=dn_series.prefix if dn_series else 'DN').aggregate(
            Max('dn_number')
        )['dn_number__max']
        sequence = 1 if not max_sequence else int(max_sequence.split('-')[-1]) + 1
        dn_number = f"{dn_series.prefix if dn_series else 'DN'}-{sequence:06d}"

        work_order.manager_approval_status = 'Approved'
        work_order.status = 'Approved'
        work_order.save()
        DeliveryNote.objects.create(
            work_order=work_order,
            dn_number=dn_number,
            delivery_status='Delivery Pending'
        )
        logger.info(f"WorkOrder {pk} approved, Delivery Note {dn_number} created")
        return Response({'status': 'Work Order approved and Delivery Note created'})

    @action(detail=True, methods=['post'], url_path='decline')
    def decline(self, request, pk=None):
        work_order = self.get_object()
        decline_reason = request.data.get('decline_reason')
        if work_order.status != 'Manager Approval' or not decline_reason:
            logger.warning(f"WorkOrder {pk} decline failed: invalid status or no decline reason")
            return Response({'error': 'Work Order must be in Manager Approval status and decline reason is required'}, status=status.HTTP_400_BAD_REQUEST)
       
        work_order.manager_approval_status = 'Declined'
        work_order.status = 'Submitted'
        work_order.decline_reason = decline_reason
        work_order.save()
        logger.info(f"WorkOrder {pk} declined and returned to Submitted status")
        return Response({'status': 'Work Order declined and returned to Processing Work Orders'})

class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='upload-signed-note')
    def upload_signed_note(self, request, pk=None):
        delivery_note = self.get_object()
        signed_delivery_note = request.FILES.get('signed_delivery_note')
        if not signed_delivery_note:
            logger.warning(f"No signed delivery note provided for DeliveryNote {pk}")
            return Response({'error': 'Signed Delivery Note is required'}, status=status.HTTP_400_BAD_REQUEST)
       
        delivery_note.signed_delivery_note = signed_delivery_note
        delivery_note.delivery_status = 'Delivered'
        delivery_note.save()
        work_order = delivery_note.work_order
        work_order.status = 'Delivered'
        work_order.save()
        logger.info(f"Signed Delivery Note uploaded for DeliveryNote {pk}, WorkOrder {work_order.id} set to Delivered")
        return Response({'status': 'Signed Delivery Note uploaded and status updated'})



