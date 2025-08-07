from rest_framework import serializers
from .models import WorkOrder, WorkOrderItem, DeliveryNote
from pre_job.models import PurchaseOrder, Quotation
from item.models import Item
from unit.models import Unit
from series.models import NumberSeries
from django.db.models import Max
from django.core.mail import send_mail
from django.conf import settings
import logging
from team.models import Technician

logger = logging.getLogger(__name__)

class WorkOrderItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), allow_null=True
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), allow_null=True
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Technician.objects.all(), allow_null=True, required=False
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrderItem
        fields = [
            "id",
            "item",
            "quantity",
            "unit",
            "unit_price",
            "total_price",
            "certificate_uut_label",
            "certificate_number",
            "calibration_date",
            "calibration_due_date",
            "uuc_serial_number",
            "certificate_file",
            "assigned_to",
        ]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

    def validate_assigned_to(self, value):
        if value is not None and not Technician.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Selected technician does not exist.")
        return value


class DeliveryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNote
        fields = [
            "id",
            "dn_number",
            "signed_delivery_note",
            "delivery_status",
            "created_at",
        ]


class WorkOrderSerializer(serializers.ModelSerializer):
    purchase_order = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseOrder.objects.all(), allow_null=True
    )
    quotation = serializers.PrimaryKeyRelatedField(
        queryset=Quotation.objects.all(), allow_null=True
    )
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=Technician.objects.all(), allow_null=True, required=False
    )
    items = WorkOrderItemSerializer(many=True, required=False)
    delivery_notes = DeliveryNoteSerializer(many=True, read_only=True) 
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    purchase_order_file = serializers.FileField(required=False)
    work_order_file = serializers.FileField(required=False)
    signed_delivery_note_file = serializers.FileField(required=False)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "purchase_order",
            "quotation",
            "wo_number",
            "status",
            "date_received",
            "expected_completion_date",
            "onsite_or_lab",
            "range",
            "serial_number",
            "site_location",
            "remarks",
            "created_at",
            "created_by",
            "manager_approval_status",
            "decline_reason",
            "items",
            "delivery_notes", 
            "created_by_name",
            "purchase_order_file",
            "work_order_file",
            "signed_delivery_note_file",
        ]

    def send_assignment_email(self, work_order, items_data):
        assigned_technicians = {
            item_data.get("assigned_to")
            for item_data in items_data
            if item_data.get("assigned_to")
        }
        for technician in assigned_technicians:
            if technician and technician.email:
                assigned_items = [
                    item_data
                    for item_data in items_data
                    if item_data.get("assigned_to") == technician
                ]
                item_details = "\n".join(
                    f"- {Item.objects.get(id=item_data['item'].id if hasattr(item_data['item'], 'id') else item_data['item']).name}: "
                    f"{item_data['quantity']} {Unit.objects.get(id=item_data['unit'].id if hasattr(item_data['unit'], 'id') else item_data['unit']).name}"
                    for item_data in assigned_items
                )
                subject = f"You Have Been Assigned to Work Order #{work_order.wo_number}"
                message = (
                    f"Dear {technician.name},\n\n"
                    f"You have been assigned to Work Order #{work_order.wo_number}:\n"
                    f'Project: {work_order.quotation.company_name or "Unnamed"}\n'
                    f"Status: {work_order.status}\n"
                    f'Expected Completion: {work_order.expected_completion_date or "Not specified"}\n'
                    f"Assigned Items:\n{item_details}\n\n"
                    f"Please check PrimeCRM for details.\n\n"
                    f"Best regards,\nPrimeCRM Team"
                )
                try:
                    send_mail(
                        subject, message, None, [technician.email], fail_silently=True
                    )
                    logger.info(f"Email sent to {technician.email} for WO #{work_order.wo_number}")
                except Exception as e:
                    logger.error(f"Failed to send email to {technician.email}: {str(e)}")

                admin_email = settings.ADMIN_EMAIL
                admin_subject = f"Work Order Assignment – #{work_order.wo_number}"
                admin_message = (
                    f"Work Order #{work_order.wo_number} assigned to {technician.name} ({technician.email}).\n"
                    f'Project: {work_order.quotation.company_name or "Unnamed"}\n'
                    f"Status: {work_order.status}\n"
                    f'Expected Completion: {work_order.expected_completion_date or "Not specified"}\n'
                    f"Assigned Items:\n{item_details}"
                )
                try:
                    send_mail(
                        admin_subject,
                        admin_message,
                        None,
                        [admin_email],
                        fail_silently=True,
                    )
                    logger.info(f"Admin email sent to {admin_email} for WO #{work_order.wo_number}")
                except Exception as e:
                    logger.error(f"Failed to send admin email to {admin_email}: {str(e)}")

    def parse_formdata_items(self, request_data):
        """Parse FormData items format into proper structure"""
        items_data = []
        item_indices = set()
        
        # Find all item indices
        for key in request_data.keys():
            if key.startswith('items[') and ']' in key:
                try:
                    index = int(key.split('[')[1].split(']')[0])
                    item_indices.add(index)
                except (ValueError, IndexError):
                    continue
        
        for index in sorted(item_indices):
            item_data = {}
            prefix = f'items[{index}]'
            
            field_mappings = {
                f'{prefix}id': 'id',
                f'{prefix}item': 'item',
                f'{prefix}quantity': 'quantity',
                f'{prefix}unit': 'unit',
                f'{prefix}unit_price': 'unit_price',
                f'{prefix}certificate_uut_label': 'certificate_uut_label',
                f'{prefix}certificate_number': 'certificate_number',
                f'{prefix}calibration_date': 'calibration_date',
                f'{prefix}calibration_due_date': 'calibration_due_date',
                f'{prefix}uuc_serial_number': 'uuc_serial_number',
                f'{prefix}assigned_to': 'assigned_to',
                f'{prefix}certificate_file': 'certificate_file',
            }
            
            for form_key, item_key in field_mappings.items():
                if form_key in request_data:
                    value = request_data[form_key]
                    if value == '' or value == 'null':
                        value = None
                        
                    elif item_key in ['item', 'unit', 'assigned_to'] and value:
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            value = None
                    elif item_key == 'quantity' and value:
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            value = None
                    elif item_key == 'unit_price' and value:
                        try:
                            value = float(value)
                        except (ValueError, TypeError):
                            value = None
                    
                    item_data[item_key] = value
            
            if item_data:  
                items_data.append(item_data)
        
        return items_data

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")
        
        if hasattr(request, 'data') and any(key.startswith('items[') for key in request.data.keys()):
            items_data = self.parse_formdata_items(request.data)
        
        if request and hasattr(request.user, "technician"):
            validated_data["created_by"] = request.user.technician
        else:
            validated_data["created_by"] = None

        try:
            wo_series = NumberSeries.objects.get(series_name="Work Order")
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Work Order series not found.")

        max_sequence = WorkOrder.objects.filter(
            wo_number__startswith=wo_series.prefix
        ).aggregate(Max("wo_number"))["wo_number__max"]
        sequence = 1 if not max_sequence else int(max_sequence.split("-")[-1]) + 1
        wo_number = f"{wo_series.prefix}-{sequence:06d}"

        work_order = WorkOrder.objects.create(
            wo_number=wo_number,
            purchase_order=validated_data.get("purchase_order"),
            quotation=validated_data.get("quotation"),
            created_by=validated_data.get("created_by"),
            status=validated_data.get("status", "Collection Pending"),
            date_received=validated_data.get("date_received"),
            expected_completion_date=validated_data.get("expected_completion_date"),
            onsite_or_lab=validated_data.get("onsite_or_lab"),
            range=validated_data.get("range"),
            serial_number=validated_data.get("serial_number"),
            site_location=validated_data.get("site_location"),
            remarks=validated_data.get("remarks"),
        )
        logger.info(f"Created WorkOrder {work_order.id} with wo_number {wo_number}")

        for item_data in items_data:
            logger.info(f"Creating item with data: {dict(item_data)}")
            WorkOrderItem.objects.create(work_order=work_order, **item_data)
            logger.info(f"Created WorkOrderItem for WorkOrder {work_order.id}")

        if any(item_data.get("assigned_to") for item_data in items_data):
            self.send_assignment_email(work_order, items_data)

        return work_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        logger.info(f"Validated data received: {validated_data}")  
        logger.info(f"Items data received: {items_data}")  

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        logger.info(f"Updated WorkOrder {instance.id}")

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                logger.info(f"Creating item with data: {dict(item_data)}")  
                WorkOrderItem.objects.create(work_order=instance, **item_data)
            logger.info(f"Updated items for WorkOrder {instance.id}")

            if any(item_data.get("assigned_to") for item_data in items_data):
                self.send_assignment_email(instance, items_data)

        return instance