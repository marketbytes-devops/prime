from rest_framework import serializers
from .models import (
    RFQ,
    RFQItem,
    Quotation,
    QuotationItem,
    QuotationTerms,
    PurchaseOrder,
    PurchaseOrderItem,
)
from item.models import Item
from unit.models import Unit
from channels.models import RFQChannel
from team.models import TeamMember
from series.models import NumberSeries
from django.db.models import Max
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta
import json
from authapp.models import CustomUser, Role
from rest_framework.response import Response


class RFQItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), allow_null=True, required=False
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), allow_null=True, required=False
    )
    quantity = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = RFQItem
        fields = ["id", "item", "quantity", "unit", "unit_price", "total_price"]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0


class QuotationTermsSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationTerms
        fields = ["id", "content", "updated_at"]

    def get_queryset(self):
        return super().get_queryset().order_by("-updated_at")[:1]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if qs.exists():
            serializer = self.get_serializer(qs[0])
            return Response(serializer.data)
        return Response({"id": None, "content": "", "updated_at": None})


class QuotationItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), allow_null=True
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), allow_null=True
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = QuotationItem
        fields = ["id", "item", "quantity", "unit", "unit_price", "total_price"]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), allow_null=True
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), allow_null=True
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "item", "quantity", "unit", "unit_price", "total_price"]

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0


# pre_job/serializers.py
# ← ONLY REPLACE THE RFQSerializer CLASS BELOW →


class RFQSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    company_address = serializers.CharField(
        max_length=200, required=False, allow_blank=True, allow_null=True
    )
    company_phone = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    company_email = serializers.EmailField(
        required=False, allow_blank=True, allow_null=True
    )

    rfq_channel = serializers.PrimaryKeyRelatedField(
        queryset=RFQChannel.objects.all(), allow_null=True, required=False
    )

    point_of_contact_name = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    point_of_contact_email = serializers.EmailField(
        required=False, allow_blank=True, allow_null=True
    )
    point_of_contact_phone = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )

    assigned_sales_person = serializers.PrimaryKeyRelatedField(
        queryset=TeamMember.objects.all(), allow_null=True, required=False
    )

    due_date_for_quotation = serializers.DateField(required=False, allow_null=True)

    items = RFQItemSerializer(many=True, required=False)
    rfq_status = serializers.ChoiceField(
        choices=[
            ("Pending", "Pending"),
            ("Processing", "Processing"),
            ("Completed", "Completed"),
        ],
        allow_null=True,
        required=False,
    )
    assigned_sales_person_name = serializers.CharField(
        source="assigned_sales_person.name", read_only=True
    )
    assigned_sales_person_email = serializers.CharField(
        source="assigned_sales_person.email", read_only=True
    )
    subtotal = serializers.SerializerMethodField()
    vat_amount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = RFQ
        fields = [
            "id",
            "company_name",
            "company_address",
            "company_phone",
            "company_email",
            "rfq_channel",
            "point_of_contact_name",
            "point_of_contact_email",
            "point_of_contact_phone",
            "assigned_sales_person",
            "due_date_for_quotation",
            "series_number",
            "created_at",
            "items",
            "rfq_status",
            "assigned_sales_person_name",
            "assigned_sales_person_email",
            "email_sent",
            "vat_applicable",
            "subtotal",
            "vat_amount",
            "grand_total",
        ]

    def get_subtotal(self, obj):
        return float(obj.get_subtotal())

    def get_vat_amount(self, obj):
        return float(obj.get_vat_amount())

    def get_grand_total(self, obj):
        return float(obj.get_grand_total())

    def validate_assigned_sales_person(self, value):
        if value and not value.email:
            raise serializers.ValidationError(
                "Selected team member must have a valid email address."
            )
        return value

    # REMOVED: send_creation_email() → now handled by Celery task

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        assigned_sales_person = validated_data.pop("assigned_sales_person", None)

        # Generate series number
        try:
            quotation_series = NumberSeries.objects.get(series_name="Quotation")
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Quotation series not found.")

        max_sequence = RFQ.objects.filter(
            series_number__startswith=quotation_series.prefix
        ).aggregate(Max("series_number"))["series_number__max"]

        sequence = 1
        if max_sequence:
            sequence = int(max_sequence.split("-")[-1]) + 1

        series_number = f"{quotation_series.prefix}-{sequence:06d}"

        # Create RFQ
        rfq = RFQ.objects.create(
            series_number=series_number,
            assigned_sales_person=assigned_sales_person,
            **validated_data,
        )

        # Bulk create items (fast even with 500+ items)
        rfq_items = [RFQItem(rfq=rfq, **item_data) for item_data in items_data]
        RFQItem.objects.bulk_create(rfq_items)

        # ASYNC EMAIL: Fire and forget using Celery
        from .tasks import send_rfq_creation_email_task

        recipients = []
        if assigned_sales_person and assigned_sales_person.email:
            recipients.append(
                (
                    assigned_sales_person.email,
                    assigned_sales_person.name or assigned_sales_person.email,
                )
            )

        if settings.ADMIN_EMAIL:
            recipients.append((settings.ADMIN_EMAIL, "Admin"))

        superadmin_role = Role.objects.filter(name="Superadmin").first()
        if superadmin_role:
            for user in CustomUser.objects.filter(
                role=superadmin_role
            ).select_related():
                if user.email:
                    name = user.get_full_name() or user.username
                    recipients.append((user.email, name))

        # Remove duplicate emails
        seen = set()
        unique_recipients = []
        for email, name in recipients:
            if email not in seen:
                seen.add(email)
                unique_recipients.append((email, name))

        # Prepare data for email
        rfq_data = {
            "series_number": rfq.series_number,
            "company_name": rfq.company_name or "Not specified",
            "due_date": (
                rfq.due_date_for_quotation.strftime("%Y-%m-%d")
                if rfq.due_date_for_quotation
                else "Not specified"
            ),
            "assigned_name": (
                assigned_sales_person.name if assigned_sales_person else "Not assigned"
            ),
            "contact_name": rfq.point_of_contact_name or "Not specified",
            "contact_email": rfq.point_of_contact_email or "Not specified",
        }

        # This returns instantly — email sent in background
        send_rfq_creation_email_task.delay(rfq_data, unique_recipients)

        # Optimistically mark as sent (you can add a retry mechanism later if needed)
        rfq.email_sent = True
        rfq.save(update_fields=["email_sent"])

        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        assigned_sales_person = validated_data.get(
            "assigned_sales_person", instance.assigned_sales_person
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            rfq_items = [RFQItem(rfq=instance, **item_data) for item_data in items_data]
            RFQItem.objects.bulk_create(rfq_items)

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["email_sent"] = getattr(instance, "email_sent", False)
        return representation


# pre_job/serializers.py → Replace your entire QuotationSerializer with this

class QuotationSerializer(serializers.ModelSerializer):
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    rfq_channel = serializers.PrimaryKeyRelatedField(
        queryset=RFQChannel.objects.all(), allow_null=True
    )
    assigned_sales_person = serializers.PrimaryKeyRelatedField(
        queryset=TeamMember.objects.all(), allow_null=True
    )
    items = QuotationItemSerializer(many=True, required=True)

    # Terms handling
    terms = QuotationTermsSerializer(required=False, allow_null=True)
    terms_id = serializers.PrimaryKeyRelatedField(
        queryset=QuotationTerms.objects.all(),
        source="terms",
        write_only=True,
        required=False,
        allow_null=True,
    )

    # Other fields...
    quotation_status = serializers.ChoiceField(
        choices=[
            ("Pending", "Pending"),
            ("Approved", "Approved"),
            ("PO Created", "PO Created"),
            ("Not Approved", "Not Approved"),
        ],
        required=False,
    )
    followup_frequency = serializers.ChoiceField(
        choices=[
            ("24_hours", "24 Hours"),
            ("3_days", "3 Days"),
            ("7_days", "7 Days"),
            ("every_7th_day", "Every 7th Day"),
        ],
        required=False,
    )
    purchase_orders = serializers.SerializerMethodField()
    assigned_sales_person_name = serializers.CharField(source="assigned_sales_person.name", read_only=True)
    assigned_sales_person_email = serializers.CharField(source="assigned_sales_person.email", read_only=True)
    not_approved_reason_remark = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    subtotal = serializers.SerializerMethodField()
    vat_amount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            "id", "rfq", "company_name", "company_address", "company_phone", "company_email",
            "rfq_channel", "point_of_contact_name", "point_of_contact_email", "point_of_contact_phone",
            "assigned_sales_person", "due_date_for_quotation", "quotation_status", "next_followup_date",
            "followup_frequency", "remarks", "series_number", "created_at", "items", "terms", "terms_id",
            "purchase_orders", "assigned_sales_person_name", "assigned_sales_person_email",
            "not_approved_reason_remark", "email_sent", "vat_applicable", "subtotal", "vat_amount", "grand_total",
        ]

    def get_subtotal(self, obj): return float(obj.get_subtotal())
    def get_vat_amount(self, obj): return float(obj.get_vat_amount())
    def get_grand_total(self, obj): return float(obj.get_grand_total())
    def get_purchase_orders(self, obj):
        pos = PurchaseOrder.objects.filter(quotation=obj)
        return PurchaseOrderSerializer(pos, many=True).data

    # REMOVED: send_submission_email() → now handled by Celery task

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        terms_data = validated_data.pop("terms", None)
        assigned_sales_person = validated_data.pop("assigned_sales_person", None)

        # Get RFQ instance
        rfq_instance = validated_data.pop('rfq')  # ← REMOVE rfq from validated_data
        if not rfq_instance or not rfq_instance.series_number:
            raise serializers.ValidationError("Valid RFQ with series number is required")

        # Get prefix from NumberSeries
        try:
            quotation_series = NumberSeries.objects.get(series_name="Quotation")
            prefix = quotation_series.prefix
        except NumberSeries.DoesNotExist:
            prefix = "001-"

        # Extract running number from RFQ (e.g., "000003" from "001-000003")
        rfq_running_number = rfq_instance.series_number.split('-')[-1]
        series_number = f"{prefix}{rfq_running_number}"  # ← SAME NUMBER!

        # Create quotation
        quotation = Quotation.objects.create(
            series_number=series_number,
            rfq=rfq_instance,                    # ← Only once
            assigned_sales_person=assigned_sales_person,
            **validated_data                     # ← Now safe — rfq removed
        )

        # Handle terms
        if terms_data:
            terms_instance = QuotationTerms.objects.create(**terms_data)
            quotation.terms = terms_instance
        else:
            default_terms_content = "YOUR DEFAULT TERMS HERE..."
            default_terms = QuotationTerms.objects.create(content=default_terms_content)
            quotation.terms = default_terms
        quotation.save()

        # Create items
        QuotationItem.objects.bulk_create([
            QuotationItem(quotation=quotation, **item_data)
            for item_data in items_data
        ])

        # Background email
        from .tasks import send_quotation_submission_email_task
        recipients = []
        if assigned_sales_person and assigned_sales_person.email:
            recipients.append((assigned_sales_person.email, assigned_sales_person.name))

        if recipients:
            quotation_data = {
                "series_number": quotation.series_number,
                "company_name": quotation.company_name or "Not specified",
                "contact_name": quotation.point_of_contact_name or "Not specified",
                "contact_email": quotation.point_of_contact_email or "Not specified",
                "assigned_name": assigned_sales_person.name if assigned_sales_person else "Not assigned",
                "status": quotation.quotation_status,
            }
            send_quotation_submission_email_task.delay(quotation_data, recipients)

        quotation.email_sent = bool(recipients)
        quotation.save(update_fields=["email_sent"])

        return quotation

    def update(self, instance, validated_data):
        # Keep your existing update logic — it's good!
        # (No email sending on update, so no Celery needed here)
        items_data = validated_data.pop("items", None)
        terms_data = validated_data.pop("terms", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if terms_data is not None:
            if instance.terms:
                for attr, value in terms_data.items():
                    setattr(instance.terms, attr, value)
                instance.terms.save()
            else:
                instance.terms = QuotationTerms.objects.create(**terms_data)

        if items_data is not None:
            instance.items.all().delete()
            QuotationItem.objects.bulk_create([
                QuotationItem(quotation=instance, **item_data)
                for item_data in items_data
            ])

        instance.save()
        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["email_sent"] = getattr(instance, "email_sent", False)
        return rep


class PurchaseOrderSerializer(serializers.ModelSerializer):
    quotation = serializers.PrimaryKeyRelatedField(queryset=Quotation.objects.all())
    items = PurchaseOrderItemSerializer(many=True, required=False)
    order_type = serializers.ChoiceField(
        choices=[("full", "Full"), ("partial", "Partial")], default="full"
    )
    client_po_number = serializers.CharField(
        max_length=100, allow_blank=True, required=False
    )
    po_file = serializers.FileField(required=False, allow_null=True)
    series_number = serializers.CharField(max_length=50, read_only=True)
    status = serializers.ChoiceField(
        choices=[
            ("Pending", "Pending"),
            ("Collected", "Collected"),
            ("Completed", "Completed"),
        ],
        default="Pending",
        required=False,
    )

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "quotation",
            "order_type",
            "client_po_number",
            "po_file",
            "created_at",
            "items",
            "series_number",
            "status",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        if not items_data and "items" in self.context["request"].POST:
            try:
                items_data = json.loads(self.context["request"].POST.get("items", "[]"))
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for items.")
        quotation = validated_data["quotation"]
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        if validated_data["order_type"] == "full":
            for item in quotation.items.all():
                PurchaseOrderItem.objects.create(
                    purchase_order=purchase_order,
                    item=item.item,
                    quantity=item.quantity,
                    unit=item.unit,
                    unit_price=item.unit_price,
                )
        else:  # partial order
            for item_data in items_data:
                item_instance = None
                unit_instance = None
                item_id = item_data.get("item")
                if item_id is not None:
                    try:
                        item_instance = Item.objects.get(id=item_id)
                    except Item.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Item with ID {item_id} does not exist."
                        )
                unit_id = item_data.get("unit")
                if unit_id is not None:
                    try:
                        unit_instance = Unit.objects.get(id=unit_id)
                    except Unit.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Unit with ID {unit_id} does not exist."
                        )
                PurchaseOrderItem.objects.create(
                    purchase_order=purchase_order,
                    item=item_instance,
                    quantity=item_data.get("quantity"),
                    unit=unit_instance,
                    unit_price=item_data.get("unit_price"),
                )
        quotation_items = set(quotation.items.values_list("id", flat=True))
        po_items = set(
            PurchaseOrderItem.objects.filter(
                purchase_order__quotation=quotation
            ).values_list("item_id", flat=True)
        )
        if quotation_items.issubset(po_items):
            quotation.quotation_status = "PO Created"
            quotation.save()
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        instance.order_type = validated_data.get("order_type", instance.order_type)
        instance.client_po_number = validated_data.get(
            "client_po_number", instance.client_po_number
        )
        instance.status = validated_data.get("status", instance.status)
        if "po_file" in validated_data:
            instance.po_file = validated_data.get("po_file")
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_instance = None
                unit_instance = None
                item_id = item_data.get("item")
                if item_id is not None:
                    try:
                        item_instance = Item.objects.get(id=item_id)
                    except Item.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Item with ID {item_id} does not exist."
                        )
                unit_id = item_data.get("unit")
                if unit_id is not None:
                    try:
                        unit_instance = Unit.objects.get(id=unit_id)
                    except Unit.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Unit with ID {unit_id} does not exist."
                        )
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    item=item_instance,
                    quantity=item_data.get("quantity"),
                    unit=unit_instance,
                    unit_price=item_data.get("unit_price"),
                )
        return instance
