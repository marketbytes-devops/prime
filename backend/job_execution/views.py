from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkOrder, DeliveryNote
from .serializers import WorkOrderSerializer, DeliveryNoteSerializer
from pre_job.models import PurchaseOrder
from team.models import TeamMember
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        purchase_order_id = self.request.query_params.get('purchase_order')
        status = self.request.query_params.get('status')
        logger.info(f"Filtering queryset with purchase_order={purchase_order_id}, status={status}")
        if purchase_order_id:
            queryset = queryset.filter(purchase_order_id=purchase_order_id)
        if status:
            queryset = queryset.filter(status=status)
        logger.info(f"Queryset count: {queryset.count()}")
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        logger.info(f"Received POST request for WorkOrder creation: {request.data}")
        if serializer.is_valid():
            self.perform_create(serializer)
            logger.info(f"WorkOrder created successfully: {serializer.data}")
            return Response(serializer.data, status=201)
        logger.error(f"Serializer validation failed: {serializer.errors}")
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['post'], url_path='create-from-purchase-order')
    def create_from_purchase_order(self, request):
        purchase_order_id = request.data.get('purchase_order')
        if not purchase_order_id:
            return Response({'error': 'purchase_order is required'}, status=400)
        try:
            purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'PurchaseOrder not found'}, status=400)
        team_member = TeamMember.objects.first()  # Use an existing TeamMember or pass via request
        if not team_member:
            return Response({'error': 'No TeamMember available to assign'}, status=400)
        work_order = WorkOrder.objects.create(
            purchase_order=purchase_order,
            status='Collection Pending',
            assigned_to=team_member
        )
        serializer = self.get_serializer(work_order)
        logger.info(f"Created WorkOrder {work_order.id} from PurchaseOrder {purchase_order_id}")
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        work_order = self.get_object()
        logger.info(f"Attempting to update status for WorkOrder {pk}. Request data: {request.data}")
        new_status = request.data.get('status')
        if new_status in dict(WorkOrder.STATUS_CHOICES).keys():
            serializer = self.get_serializer(work_order, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                updated_work_order = WorkOrder.objects.get(pk=pk)  # Refresh from DB
                logger.info(f"Status updated successfully: {serializer.data}")
                return Response(self.get_serializer(updated_work_order).data)
            logger.error(f"Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=400)
        logger.warning(f"Invalid status value: {new_status}")
        return Response({'error': 'Invalid status value'}, status=400)

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

    @action(detail=True, methods=['get'])
    def can_convert_to_work_order(self, request, pk=None):
        work_order = self.get_object()
        return Response({'can_convert': work_order.status == 'Collected'})

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