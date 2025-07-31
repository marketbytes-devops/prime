from rest_framework import serializers
from .models import WorkOrder, WorkOrderItem, DeliveryNote
from pre_job.models import PurchaseOrder, Quotation
from team.models import TeamMember
from item.models import Item
from unit.models import Unit
from series.models import NumberSeries
from django.db.models import Max
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import date
import logging

logger = logging.getLogger(__name__)

class WorkOrderItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), allow_null=True)
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrderItem
        fields = [
            'id', 'item', 'quantity', 'unit', 'unit_price', 'total_price',
            'certificate_number', 'calibration_date', 'calibration_due_date',
            'uuc_serial_number', 'certificate_file'
        ]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

class DeliveryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNote
        fields = ['id', 'dn_number', 'signed_delivery_note', 'delivery_status', 'created_at']

class WorkOrderSerializer(serializers.ModelSerializer):
    purchase_order = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrder.objects.all(), allow_null=True)
    quotation = serializers.PrimaryKeyRelatedField(queryset=Quotation.objects.all(), allow_null=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    created_by = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = WorkOrderItemSerializer(many=True, required=False)
    delivery_note = DeliveryNoteSerializer(read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'purchase_order', 'quotation', 'wo_number', 'assigned_to', 'status',
            'date_received', 'expected_completion_date', 'onsite_or_lab', 'range',
            'serial_number', 'site_location', 'remarks', 'created_at', 'created_by',
            'manager_approval_status', 'decline_reason', 'items', 'delivery_note',
            'assigned_to_name', 'created_by_name'
        ]

    def send_assignment_email(self, work_order, assigned_to):
        if assigned_to and assigned_to.email:
            subject = f'You Have Been Assigned to Work Order #{work_order.wo_number}'
            message = (
                f'Dear {assigned_to.name},\n\n'
                f'You have been assigned to Work Order #{work_order.wo_number}:\n'
                f'Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'Status: {work_order.status}\n'
                f'Expected Completion: {work_order.expected_completion_date or "Not specified"}\n\n'
                f'Please check PrimeCRM for details.\n\n'
                f'Best regards,\nPrimeCRM Team'
            )
            try:
                send_mail(subject, message, None, [assigned_to.email], fail_silently=True)
                logger.info(f"Email sent to {assigned_to.email} for WO #{work_order.wo_number}")
            except Exception as e:
                logger.error(f"Failed to send email to {assigned_to.email}: {str(e)}")

            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Work Order Assignment – #{work_order.wo_number}'
            admin_message = (
                f'Work Order #{work_order.wo_number} assigned to {assigned_to.name} ({assigned_to.email}).\n'
                f'Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'Status: {work_order.status}\n'
                f'Expected Completion: {work_order.expected_completion_date or "Not specified"}'
            )
            try:
                send_mail(admin_subject, admin_message, None, [admin_email], fail_silently=True)
                logger.info(f"Admin email sent to {admin_email} for WO #{work_order.wo_number}")
            except Exception as e:
                logger.error(f"Failed to send admin email to {admin_email}: {str(e)}")

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assigned_to = validated_data.get('assigned_to')
        created_by = validated_data.get('created_by')
        status = validated_data.get('status', 'Collection Pending')

        try:
            wo_series = NumberSeries.objects.get(series_name='Work Order')
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Work Order series not found.")

        max_sequence = WorkOrder.objects.filter(wo_number__startswith=wo_series.prefix).aggregate(
            Max('wo_number')
        )['wo_number__max']
        sequence = 1 if not max_sequence else int(max_sequence.split('-')[-1]) + 1
        wo_number = f"{wo_series.prefix}-{sequence:06d}"

        work_order = WorkOrder.objects.create(
            wo_number=wo_number,
            purchase_order=validated_data.get('purchase_order'),
            quotation=validated_data.get('quotation'),
            assigned_to=assigned_to,
            created_by=created_by,
            status=status,
            date_received=validated_data.get('date_received'),
            expected_completion_date=validated_data.get('expected_completion_date'),
            onsite_or_lab=validated_data.get('onsite_or_lab'),
            range=validated_data.get('range'),
            serial_number=validated_data.get('serial_number'),
            site_location=validated_data.get('site_location'),
            remarks=validated_data.get('remarks')
        )
        logger.info(f"Created WorkOrder {work_order.id} with wo_number {wo_number}, purchase_order {work_order.purchase_order_id}, status {work_order.status}, assigned_to {assigned_to.id if assigned_to else None}, created_by {created_by.id if created_by else None}")

        for item_data in items_data:
            WorkOrderItem.objects.create(work_order=work_order, **item_data)
            logger.info(f"Created WorkOrderItem for WorkOrder {work_order.id}")

        if assigned_to:
            self.send_assignment_email(work_order, assigned_to)

        return work_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        assigned_to = validated_data.get('assigned_to', instance.assigned_to)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        logger.info(f"Updated WorkOrder {instance.id}")

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                WorkOrderItem.objects.create(work_order=instance, **item_data)
            logger.info(f"Updated items for WorkOrder {instance.id}")

        if assigned_to and (not instance.assigned_to or instance.assigned_to.id != assigned_to.id):
            self.send_assignment_email(instance, assigned_to)

        return instance