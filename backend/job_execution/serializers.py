from rest_framework import serializers
from .models import (
    WorkOrder,
    WorkOrderItem,
    DeliveryNote,
    DeliveryNoteItem,
    DeliveryNoteItemComponent,
    Invoice
)
from pre_job.models import PurchaseOrder, Quotation
from item.models import Item
from unit.models import Unit
from series.models import NumberSeries
from team.models import Technician
from django.db.models import Max
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta
import logging
from authapp.models import CustomUser, Role

logger = logging.getLogger(__name__)

class DeliveryNoteItemComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNoteItemComponent
        fields = ["id", "component", "value"]

class DeliveryNoteItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), allow_null=True
    )
    uom = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), allow_null=True
    )
    components = DeliveryNoteItemComponentSerializer(many=True, required=False)

    class Meta:
        model = DeliveryNoteItem
        fields = [
            "id",
            "item",
            "range",
            "quantity",
            "delivered_quantity",
            "uom",
            "components",
        ]

    def validate(self, data):
        if data.get("quantity") != data.get("delivered_quantity"):
            raise serializers.ValidationError(
                {"delivered_quantity": "Delivered quantity must equal quantity."}
            )
        return data

    def create(self, validated_data):
        components_data = validated_data.pop("components", [])
        delivery_note_item = DeliveryNoteItem.objects.create(**validated_data)
        for component_data in components_data:
            DeliveryNoteItemComponent.objects.create(
                delivery_note_item=delivery_note_item, **component_data
            )
        return delivery_note_item

    def update(self, instance, validated_data):
        components_data = validated_data.pop("components", [])
        instance.item = validated_data.get("item", instance.item)
        instance.range = validated_data.get("range", instance.range)
        instance.quantity = validated_data.get("quantity", instance.quantity)
        instance.delivered_quantity = validated_data.get(
            "delivered_quantity", instance.delivered_quantity
        )
        instance.uom = validated_data.get("uom", instance.uom)
        instance.save()
        instance.components.all().delete()
        for component_data in components_data:
            DeliveryNoteItemComponent.objects.create(
                delivery_note_item=instance, **component_data
            )
        return instance

class DeliveryNoteSerializer(serializers.ModelSerializer):
    work_order_id = serializers.PrimaryKeyRelatedField(
        source="work_order", read_only=True
    )
    work_order_number = serializers.CharField(
        source="work_order.wo_number", read_only=True
    )
    items = DeliveryNoteItemSerializer(many=True, required=False)
    series = serializers.PrimaryKeyRelatedField(
        queryset=NumberSeries.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = DeliveryNote
        fields = [
            "id",
            "dn_number",
            "work_order",
            "work_order_id",
            "work_order_number",
            "signed_delivery_note",
            "delivery_status",
            "created_at",
            "items",
            "series",
        ]

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", [])
        instance.dn_number = validated_data.get("dn_number", instance.dn_number)
        instance.signed_delivery_note = validated_data.get(
            "signed_delivery_note", instance.signed_delivery_note
        )
        instance.delivery_status = validated_data.get(
            "delivery_status", instance.delivery_status
        )
        instance.series = validated_data.get("series", instance.series)
        instance.save()
        if items_data:
            instance.items.all().delete()
            for item_data in items_data:
                components_data = item_data.pop("components", [])
                delivery_note_item = DeliveryNoteItem.objects.create(
                    delivery_note=instance,
                    item=item_data.get("item"),
                    range=item_data.get("range"),
                    quantity=item_data.get("quantity"),
                    delivered_quantity=item_data.get("delivered_quantity"),
                    uom=item_data.get("uom"),
                )
                for component_data in components_data:
                    DeliveryNoteItemComponent.objects.create(
                        delivery_note_item=delivery_note_item,
                        component=component_data.get("component"),
                        value=component_data.get("value"),
                    )
        return instance

class InitiateDeliverySerializer(serializers.Serializer):
    delivery_type = serializers.ChoiceField(choices=["Single", "Multiple"])
    items = DeliveryNoteItemSerializer(many=True)

    def validate(self, data):
        if not data.get("items"):
            raise serializers.ValidationError(
                {"items": "At least one item is required."}
            )
        return data

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
    calibration_date = serializers.DateField(
        required=False, allow_null=True, input_formats=["%Y-%m-%d", "%d-%m-%Y"]
    )
    calibration_due_date = serializers.DateField(
        required=False, allow_null=True, input_formats=["%Y-%m-%d", "%d-%m-%Y"]
    )

    class Meta:
        model = WorkOrderItem
        fields = [
            "id",
            "item",
            "quantity",
            "unit",
            "unit_price",
            "range",
            "certificate_uut_label",
            "certificate_number",
            "calibration_date",
            "calibration_due_date",
            "uuc_serial_number",
            "certificate_file",
            "assigned_to",
            "total_price",
        ]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

    def validate_assigned_to(self, value):
        if value is not None and not Technician.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Selected technician does not exist.")
        return value

    def validate(self, data):
        instance = getattr(self, "instance", None)
        is_update = instance is not None
        if is_update and instance.range is not None and "range" not in data:
            raise serializers.ValidationError(
                {
                    "range": "Range is required for each item during update if previously set."
                }
            )
        return data

class InvoiceSerializer(serializers.ModelSerializer):
    delivery_note_id = serializers.PrimaryKeyRelatedField(
        source='delivery_note',
        queryset=DeliveryNote.objects.all()
    )
    delivery_note_item_id = serializers.PrimaryKeyRelatedField(
        source='delivery_note_item',
        queryset=DeliveryNoteItem.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Invoice
        fields = [
            'id',
            'delivery_note',
            'delivery_note_id',
            'delivery_note_item',
            'delivery_note_item_id',
            'invoice_file',
            'invoice_status',
            'due_in_days',
            'received_date',
            'payment_reference_number',
            'created_at',
            'updated_at'
        ]

    def validate(self, data):
        invoice_status = data.get('invoice_status')
        due_in_days = data.get('due_in_days')
        received_date = data.get('received_date')
        invoice_file = data.get('invoice_file')

        if invoice_status == 'raised' and (not due_in_days or due_in_days <= 0):
            raise serializers.ValidationError({
                'due_in_days': "Due in days is required and must be a positive integer for 'raised' status."
            })
        if invoice_status == 'processed':
            if not received_date:
                raise serializers.ValidationError({
                    'received_date': "Received date is required for 'processed' status."
                })
            if not invoice_file:
                raise serializers.ValidationError({
                    'invoice_file': "Invoice file is required for 'processed' status."
                })
        return data

    def send_invoice_status_change_email(self, invoice, new_status):
        email_sent = False
        recipient_list = []
        work_order = invoice.delivery_note.work_order
        if (
            work_order.quotation
            and work_order.quotation.assigned_sales_person
            and work_order.quotation.assigned_sales_person.email
        ):
            recipient_list.append(
                (
                    work_order.quotation.assigned_sales_person.email,
                    work_order.quotation.assigned_sales_person.name,
                )
            )
        if settings.ADMIN_EMAIL:
            recipient_list.append((settings.ADMIN_EMAIL, None))
        superadmin_role = Role.objects.filter(name="Superadmin").first()
        if superadmin_role:
            superadmin_users = CustomUser.objects.filter(role=superadmin_role)
            for user in superadmin_users:
                if user.email:
                    recipient_list.append((user.email, user.name or user.username))
        recipient_dict = {email: name for email, name in recipient_list}
        recipient_list = [(email, name) for email, name in recipient_dict.items()]

        if recipient_list:
            for email, name in recipient_list:
                salutation = (
                    "Dear Admin" if email == settings.ADMIN_EMAIL
                    else f"Dear {name}" if name and (
                        superadmin_role and CustomUser.objects.filter(email=email, role=superadmin_role).exists()
                        or work_order.quotation and email == (
                            work_order.quotation.assigned_sales_person.email
                            if work_order.quotation.assigned_sales_person
                            else None
                        )
                    )
                    else "Dear Recipient"
                )
                subject = f"Invoice #{invoice.id} Status Changed to {new_status}"
                message = (
                    f"{salutation},\n\n"
                    f"The invoice status for the following Delivery Note has been updated:\n"
                    f"------------------------------------------------------------\n"
                    f"🔹 Work Order Number: {work_order.wo_number}\n"
                    f"🔹 Delivery Note Number: {invoice.delivery_note.dn_number}\n"
                    f"🔹 Invoice ID: {invoice.id}\n"
                    f"🔹 Project: {work_order.quotation.company_name or 'Unnamed'}\n"
                    f"🔹 New Invoice Status: {new_status}\n"
                    f"🔹 Due in Days: {invoice.due_in_days or 'Not specified'}\n"
                    f"🔹 Received Date: {invoice.received_date or 'Not specified'}\n"
                    f"------------------------------------------------------------\n"
                    f"Please log in to your PrimeCRM dashboard to review the details and take any necessary actions.\n\n"
                    f"Best regards,\n"
                    f"PrimeCRM Team\n"
                    f"---\n"
                    f"This is an automated message. Please do not reply to this email."
                )
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[email],
                        fail_silently=True,
                    )
                    email_sent = True
                    logger.info(f"Invoice status change email sent to {email} for Invoice #{invoice.id}")
                except Exception as e:
                    logger.error(f"Failed to send invoice status change email to {email} for Invoice #{invoice.id}: {str(e)}")
        return email_sent

    def create(self, validated_data):
        invoice = Invoice.objects.create(**validated_data)
        new_status = validated_data.get('invoice_status')
        if new_status in ['raised', 'processed']:
            self.send_invoice_status_change_email(invoice, new_status)
        return invoice

    def update(self, instance, validated_data):
        previous_status = instance.invoice_status
        new_status = validated_data.get('invoice_status', instance.invoice_status)
        request = self.context.get('request')
        from_processed_invoices = request and request.data.get('from_processed_invoices', False)

        # Allow status change from 'processed' to 'pending' only if from_processed_invoices is True
        if instance.invoice_status == 'processed' and new_status != 'processed' and not from_processed_invoices:
            raise serializers.ValidationError({
                'invoice_status': "Cannot change invoice status from 'processed' to another status."
            })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if new_status != previous_status and new_status in ['raised', 'processed']:
            self.send_invoice_status_change_email(instance, new_status)

        return instance

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
    wo_type = serializers.CharField(required=False, allow_null=True)
    application_status = serializers.CharField(
        max_length=20, allow_null=True, required=False
    )
    date_received = serializers.DateField(
        required=False, allow_null=True, input_formats=["%Y-%m-%d", "%d-%m-%Y"]
    )
    expected_completion_date = serializers.DateField(
        required=False, allow_null=True, input_formats=["%Y-%m-%d", "%d-%m-%Y"]
    )

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
            "wo_type",
            "application_status",
            "invoice_delivery_note",
        ]

    def parse_formdata_items(self, request_data):
        items_data = []
        item_indices = set()
        for key in request_data.keys():
            if key.startswith("items[") and "]" in key:
                try:
                    index = int(key.split("[")[1].split("]")[0])
                    item_indices.add(index)
                except (ValueError, IndexError):
                    continue
        for index in sorted(item_indices):
            item_data = {}
            prefix = f"items[{index}]"
            field_mappings = {
                f"{prefix}id": "id",
                f"{prefix}item": "item",
                f"{prefix}quantity": "quantity",
                f"{prefix}unit": "unit",
                f"{prefix}unit_price": "unit_price",
                f"{prefix}range": "range",
                f"{prefix}certificate_uut_label": "certificate_uut_label",
                f"{prefix}certificate_number": "certificate_number",
                f"{prefix}calibration_date": "calibration_date",
                f"{prefix}calibration_due_date": "calibration_due_date",
                f"{prefix}uuc_serial_number": "uuc_serial_number",
                f"{prefix}assigned_to": "assigned_to",
                f"{prefix}certificate_file": "certificate_file",
            }
            for form_key, item_key in field_mappings.items():
                if form_key in request_data:
                    value = request_data[form_key]
                    if value == "" or value == "null":
                        value = None
                    elif item_key in ["item", "unit", "assigned_to"] and value:
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            value = None
                    elif item_key == "quantity" and value:
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            value = None
                    elif item_key == "range" and value:
                        try:
                            value = int(value)
                        except (ValueError, TypeError):
                            raise serializers.ValidationError(
                                {
                                    "range": f"Invalid range value for item {index}: must be an integer."
                                }
                            )
                    elif item_key == "unit_price" and value:
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
        if hasattr(request, "data") and any(
            key.startswith("items[") for key in request.data.keys()
        ):
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
            site_location=validated_data.get("site_location"),
            remarks=validated_data.get("remarks"),
            wo_type=validated_data.get("wo_type"),
            application_status=validated_data.get("application_status"),
        )
        logger.info(f"Created WorkOrder {work_order.id} with wo_number {wo_number}")
        for item_data in items_data:
            item_data.setdefault("range", None)
            logger.info(f"Creating item with data: {dict(item_data)}")
            WorkOrderItem.objects.create(work_order=work_order, **item_data)
            logger.info(f"Created WorkOrderItem for WorkOrder {work_order.id}")
        return work_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
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
        return instance