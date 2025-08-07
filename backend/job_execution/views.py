from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from .models import WorkOrder, DeliveryNote
from .serializers import WorkOrderSerializer, DeliveryNoteSerializer

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.prefetch_related('delivery_notes', 'items__assigned_to').all()
    serializer_class = WorkOrderSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Manager Approval':
            return Response({'error': 'Work Order must be in Manager Approval status'}, status=status.HTTP_400_BAD_REQUEST)

        delivery_note_type = request.data.get('delivery_note_type', 'single')
        wo_number = request.data.get('wo_number', work_order.wo_number)

        work_order.manager_approval_status = 'Approved'
        work_order.status = 'Approved'
        work_order.save()

        if delivery_note_type == 'single':
            DeliveryNote.objects.update_or_create(
                work_order=work_order,
                defaults={'dn_number': wo_number, 'delivery_status': 'Delivery Pending'}
            )
        elif delivery_note_type == 'multiple':
            for item in work_order.items.all():
                DeliveryNote.objects.create(
                    work_order=work_order,
                    dn_number=f"{wo_number}-{item.id}",
                    delivery_status='Delivery Pending'
                )

        return Response({'status': 'Work Order approved and Delivery Note created'})

    @action(detail=True, methods=['patch'], url_path='close')
    def close(self, request, pk=None):
        work_order = self.get_object()
        if work_order.status != 'Delivered':
            return Response({'error': 'Work Order must be in Delivered status to close'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle file uploads
        purchase_order_file = request.FILES.get('purchase_order_file')
        work_order_file = request.FILES.get('work_order_file')
        signed_delivery_note_file = request.FILES.get('signed_delivery_note_file')

        if not signed_delivery_note_file:
            return Response({'error': 'Signed Delivery Note is required'}, status=status.HTTP_400_BAD_REQUEST)

        if purchase_order_file:
            file_path = default_storage.save(f'work_orders/purchase_orders/{purchase_order_file.name}', purchase_order_file)
            work_order.purchase_order_file = file_path
        if work_order_file:
            file_path = default_storage.save(f'work_orders/work_orders/{work_order_file.name}', work_order_file)
            work_order.work_order_file = file_path
        if signed_delivery_note_file:
            file_path = default_storage.save(f'work_orders/delivery_notes/{signed_delivery_note_file.name}', signed_delivery_note_file)
            work_order.signed_delivery_note_file = file_path

        work_order.status = 'Closed'
        work_order.save()

        serializer = self.get_serializer(work_order)
        return Response({
            'status': 'Work Order closed and submitted for invoicing',
            'data': serializer.data
        }, status=status.HTTP_200_OK)

class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='upload-signed-note')
    def upload_signed_note(self, request, pk=None):
        try:
            delivery_note = self.get_object()
            file = request.FILES.get('signed_delivery_note')
            if file:
                # Save the file
                file_path = default_storage.save(f'delivery_notes/{file.name}', file)
                delivery_note.signed_delivery_note = file_path
                delivery_note.delivery_status = 'Delivered'  # Update status after upload
                delivery_note.save()
                serializer = self.get_serializer(delivery_note)
                return Response({
                    'status': 'Signed Delivery Note uploaded and status updated',
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        except DeliveryNote.DoesNotExist:
            return Response({'error': 'Delivery note not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)