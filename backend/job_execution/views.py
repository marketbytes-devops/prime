from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import WorkOrder, DeliveryNote, DeliveryNoteItem, DeliveryNoteItemComponent
from .serializers import (
    WorkOrderSerializer,
    DeliveryNoteSerializer,
    InitiateDeliverySerializer,
    DeliveryNoteItemSerializer,
    DeliveryNoteItemComponentSerializer
)
from django.db.models import Max
from series.models import NumberSeries
import logging
from django.db import transaction
from unit.models import Unit

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
        return Response(
            {'error': 'All items must have certificate number and calibration due date'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Manager Approval':
            logger.warning(f"WorkOrder {pk} not in Manager Approval status")
            return Response(
                {'error': 'Work Order must be in Manager Approval status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            dn_series = NumberSeries.objects.get(series_name='Delivery Note')
        except NumberSeries.DoesNotExist:
            logger.error("Delivery Note series not found")
            return Response(
                {'error': 'Delivery Note series not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        with transaction.atomic():
            delivery_note = work_order.delivery_notes.first()
            if delivery_note:
                delivery_note.dn_number = f"TEMP-DN-{work_order.id:06d}"
                delivery_note.series = dn_series
                delivery_note.delivery_status = 'Delivery Pending'
                delivery_note.save()
                logger.info(f"Updated existing Delivery Note with temp DN for WorkOrder {pk}")
            else:
                delivery_note = DeliveryNote.objects.create(
                    work_order=work_order,
                    series=dn_series,
                    dn_number=f"TEMP-DN-{work_order.id:06d}",
                    delivery_status='Delivery Pending'
                )
                for item in work_order.items.all():
                    DeliveryNoteItem.objects.create(
                        delivery_note=delivery_note,
                        item=item.item,
                        range=item.range,
                        quantity=item.quantity,
                        delivered_quantity=item.quantity,
                        uom=item.unit,
                        invoice_status='pending'
                    )
                logger.info(f"Created new Delivery Note with temp DN for WorkOrder {pk}")

            work_order.manager_approval_status = 'Approved'
            work_order.status = 'Approved'
            work_order.save()

        return Response(
            {'status': 'Work Order approved and Delivery Note updated/created with temporary DN'}
        )

    @action(detail=True, methods=['post'], url_path='decline')
    def decline(self, request, pk=None):
        work_order = self.get_object()
        decline_reason = request.data.get('decline_reason')
        if work_order.status != 'Manager Approval' or not decline_reason:
            logger.warning(f"WorkOrder {pk} decline failed: invalid status or no decline reason")
            return Response(
                {'error': 'Work Order must be in Manager Approval status and decline reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        work_order.manager_approval_status = 'Declined'
        work_order.status = 'Declined'
        work_order.decline_reason = decline_reason
        work_order.save()

        logger.info(f"WorkOrder {pk} declined and status set to Declined")
        return Response({'status': 'Work Order declined and returned to Processing Work Orders'})

    @action(detail=True, methods=['post'], url_path='resubmit')
    def resubmit(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Declined':
            logger.warning(f"WorkOrder {pk} not in Declined status for resubmit")
            return Response(
                {'error': 'Work Order must be in Declined status to resubmit'},
                status=status.HTTP_400_BAD_REQUEST
            )

        work_order.manager_approval_status = 'Pending'
        work_order.status = 'Manager Approval'
        work_order.save()

        logger.info(f"WorkOrder {pk} resubmitted for Manager Approval")
        return Response({'status': 'Work Order resubmitted for Manager Approval'})

    @action(detail=True, methods=['patch'], url_path='update-delivery-note-item-invoice-status')
    def update_delivery_note_item_invoice_status(self, request, pk=None):
        delivery_note_item_id = request.data.get('delivery_note_item_id')
        new_status = request.data.get('invoice_status')
        due_in_days = request.data.get('due_in_days')
        received_date = request.data.get('received_date')
        invoice_file = request.FILES.get('invoice_file')

        if not delivery_note_item_id:
            return Response(
                {'error': 'Delivery note item ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not new_status:
            return Response(
                {'error': 'Invoice status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            delivery_note_item = DeliveryNoteItem.objects.get(id=delivery_note_item_id)
        except DeliveryNoteItem.DoesNotExist:
            return Response(
                {'error': 'Delivery note item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if new_status == 'raised':
            if not due_in_days or int(due_in_days) <= 0:
                return Response(
                    {'error': 'Due in days is required and must be a positive integer for Raised status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            delivery_note_item.due_in_days = int(due_in_days)

        if new_status == 'processed':
            if not received_date:
                return Response(
                    {'error': 'Received date is required for Processed status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            delivery_note_item.received_date = received_date

        if delivery_note_item.invoice_status == 'processed' and new_status != 'processed':
            return Response(
                {'error': "Cannot change invoice status from 'processed' to another status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        previous_invoice_status = delivery_note_item.invoice_status
        delivery_note_item.invoice_status = new_status
        if invoice_file:
            delivery_note_item.invoice_file = invoice_file
        delivery_note_item.save()

        if new_status != previous_invoice_status and new_status in ['raised', 'processed']:
            serializer = WorkOrderSerializer()
            email_sent = serializer.send_invoice_status_change_email(delivery_note_item, new_status)
            logger.info(f"Email sent status for DeliveryNoteItem {delivery_note_item.id}: {email_sent}")

        serializer = DeliveryNoteItemSerializer(delivery_note_item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='initiate-delivery')
    def initiate_delivery(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Approved':
            logger.warning(f"WorkOrder {pk} not in Approved status for initiating delivery")
            return Response(
                {'error': 'Work Order must be in Approved status to initiate delivery'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InitiateDeliverySerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Initiate delivery failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        delivery_type = serializer.validated_data['delivery_type']
        items_data = serializer.validated_data['items']

        try:
            dn_series = NumberSeries.objects.get(series_name='Delivery Note')
        except NumberSeries.DoesNotExist:
            logger.error("Delivery Note series not found")
            return Response(
                {'error': 'Delivery Note series not found'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        with transaction.atomic():
            work_order_items = {item.id: item.quantity for item in work_order.items.all()}
            existing_dns = work_order.delivery_notes.all()
            assigned_quantities = {}

            for item_data in items_data:
                item_id = item_data.get('item').id if item_data.get('item') else None
                if item_id:
                    assigned_quantities[item_id] = assigned_quantities.get(item_id, 0) + (item_data.get('quantity') or 0)

            for dn in existing_dns:
                for dn_item in dn.items.all():
                    item_id = dn_item.item.id if dn_item.item else None
                    if item_id:
                        assigned_quantities[item_id] = assigned_quantities.get(item_id, 0) + (dn_item.quantity or 0)

            for item_id, total_quantity in work_order_items.items():
                assigned = assigned_quantities.get(item_id, 0)
                if assigned > total_quantity:
                    return Response(
                        {'error': f'Assigned quantity for item {item_id} exceeds work order quantity'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            max_sequence = DeliveryNote.objects.filter(dn_number__startswith=dn_series.prefix).aggregate(
                Max('dn_number')
            )['dn_number__max']
            sequence = 1 if not max_sequence else int(max_sequence.split('-')[-1]) + 1
            dn_number = f"{dn_series.prefix}-{sequence:06d}"

            if delivery_type == 'Single':
                delivery_note = work_order.delivery_notes.first()
                if delivery_note:
                    delivery_note.dn_number = dn_number
                    delivery_note.items.all().delete()
                    for item_data in items_data:
                        components_data = item_data.pop('components', [])
                        delivery_note_item = DeliveryNoteItem.objects.create(
                            delivery_note=delivery_note,
                            item=item_data.get('item'),
                            range=item_data.get('range'),
                            quantity=item_data.get('quantity'),
                            delivered_quantity=item_data.get('delivered_quantity'),
                            uom=item_data.get('uom'),
                            invoice_status='pending'
                        )
                        for component_data in components_data:
                            DeliveryNoteItemComponent.objects.create(
                                delivery_note_item=delivery_note_item,
                                component=component_data.get('component'),
                                value=component_data.get('value')
                            )
                    delivery_note.save()
                    logger.info(f"Updated Delivery Note {dn_number} for WorkOrder {pk}")
                else:
                    delivery_note = DeliveryNote.objects.create(
                        work_order=work_order,
                        dn_number=dn_number,
                        delivery_status='Delivery Pending',
                        series=dn_series
                    )
                    for item_data in items_data:
                        components_data = item_data.pop('components', [])
                        delivery_note_item = DeliveryNoteItem.objects.create(
                            delivery_note=delivery_note,
                            item=item_data.get('item'),
                            range=item_data.get('range'),
                            quantity=item_data.get('quantity'),
                            delivered_quantity=item_data.get('delivered_quantity'),
                            uom=item_data.get('uom'),
                            invoice_status='pending'
                        )
                        for component_data in components_data:
                            DeliveryNoteItemComponent.objects.create(
                                delivery_note_item=delivery_note_item,
                                component=component_data.get('component'),
                                value=component_data.get('value')
                            )
                    logger.info(f"Created Delivery Note {dn_number} for WorkOrder {pk} with {len(items_data)} items")
            else:  # Multiple
                delivery_note = DeliveryNote.objects.create(
                    work_order=work_order,
                    dn_number=dn_number,
                    delivery_status='Delivery Pending',
                    series=dn_series
                )
                for item_data in items_data:
                    components_data = item_data.pop('components', [])
                    delivery_note_item = DeliveryNoteItem.objects.create(
                        delivery_note=delivery_note,
                        item=item_data.get('item'),
                        range=item_data.get('range'),
                        quantity=item_data.get('quantity'),
                        delivered_quantity=item_data.get('delivered_quantity'),
                        uom=item_data.get('uom'),
                        invoice_status='pending'
                    )
                    for component_data in components_data:
                        DeliveryNoteItemComponent.objects.create(
                            delivery_note_item=delivery_note_item,
                            component=component_data.get('component'),
                            value=component_data.get('value')
                        )
                    logger.info(f"Created Delivery Note {dn_number} for WorkOrder {pk} with {len(items_data)} items")

        return Response(
            {
                'status': 'Delivery initiated successfully',
                'delivery_type': delivery_type,
                'dn_number': dn_number
            }
        )

class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='upload-signed-note')
    def upload_signed_note(self, request, pk=None):
        delivery_note = self.get_object()
        signed_delivery_note = request.FILES.get('signed_delivery_note')
        if not signed_delivery_note:
            logger.warning(f"No signed delivery note provided for Delivery Note {pk}")
            return Response(
                {'error': 'Signed Delivery Note is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery_note.signed_delivery_note = signed_delivery_note
        delivery_note.delivery_status = 'Delivered'
        delivery_note.save()
        work_order = delivery_note.work_order
        if all(dn.delivery_status == 'Delivered' for dn in work_order.delivery_notes.all()):
            work_order.status = 'Delivered'
            work_order.save()
        logger.info(f"Signed Delivery Note uploaded for Delivery Note {pk}, WorkOrder {work_order.id} status updated")
        return Response({'status': 'Signed Delivery Note uploaded and status updated'})

class DeliveryNoteItemComponentViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNoteItemComponent.objects.all()
    serializer_class = DeliveryNoteItemComponentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        delivery_note_item_id = self.request.query_params.get('delivery_note_item_id')
        if delivery_note_item_id:
            queryset = queryset.filter(delivery_note_item_id=delivery_note_item_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            logger.info(f"DeliveryNoteItemComponent created: {serializer.data['id']}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)