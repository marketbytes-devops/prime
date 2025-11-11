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


class RFQSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(max_length=100, required=True)
    company_address = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    company_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    company_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    rfq_channel = serializers.PrimaryKeyRelatedField(
        queryset=RFQChannel.objects.all(), allow_null=True, required=False
    )
    
    point_of_contact_name = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    point_of_contact_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    point_of_contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    
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
    
    def validate(self, data):
        if not data.get('company_name'):
            raise serializers.ValidationError({
                "company_name": "Company name is required."
            })
        return data

    def send_creation_email(self, rfq):
        email_sent = False
        recipient_list = []

        if rfq.assigned_sales_person and rfq.assigned_sales_person.email:
            recipient_list.append(
                (rfq.assigned_sales_person.email, rfq.assigned_sales_person.name)
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
                if email == settings.ADMIN_EMAIL:
                    salutation = "Dear Admin"
                elif (
                    superadmin_role
                    and CustomUser.objects.filter(
                        email=email, role=superadmin_role
                    ).exists()
                ):
                    salutation = f"Dear {name}" if name else "Dear Superadmin"
                elif (
                    email
                    == (
                        rfq.assigned_sales_person.email
                        if rfq.assigned_sales_person
                        else None
                    )
                    and name
                ):
                    salutation = f"Dear {name}"
                else:
                    salutation = "Dear Recipient"

                subject = f"New RFQ Created: #{rfq.series_number}"
                message = (
                    f"{salutation},\n\n"
                    f"A new Request for Quotation (RFQ) has been created in PrimeCRM:\n"
                    f"------------------------------------------------------------\n"
                    f"🔹 RFQ Number: {rfq.series_number}\n"
                    f'🔹 Project: {rfq.company_name or "Not specified"}\n'
                    f'🔹 Due Date: {rfq.due_date_for_quotation or "Not specified"}\n'
                    f'🔹 Status: {rfq.rfq_status or "Pending"}\n'
                    f'🔹 Assigned To: {rfq.assigned_sales_person.name if rfq.assigned_sales_person else "Not assigned"}\n'
                    f'🔹 Company: {rfq.company_name or "Not specified"}\n'
                    f'🔹 Contact: {rfq.point_of_contact_name or "Not specified"} ({rfq.point_of_contact_email or "Not specified"})\n'
                    f"------------------------------------------------------------\n"
                    f"Please log in to your PrimeCRM dashboard to view the details and take any necessary actions.\n\n"
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
                    print(
                        f"RFQ creation email sent successfully to {email} for RFQ #{rfq.series_number}"
                    )
                except Exception as e:
                    print(
                        f"Failed to send RFQ creation email to {email} for RFQ #{rfq.series_number}: {str(e)}"
                    )
        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        assigned_sales_person = validated_data.pop("assigned_sales_person", None)
        
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
        
        rfq = RFQ.objects.create(
            series_number=series_number,
            assigned_sales_person=assigned_sales_person,
            **validated_data,
        )
        
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        
        creation_email_sent = self.send_creation_email(rfq)
        rfq.email_sent = creation_email_sent
        rfq.save()
        
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
            for item_data in items_data:
                RFQItem.objects.create(rfq=instance, **item_data)
        
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["email_sent"] = getattr(instance, "email_sent", False)
        return representation


class QuotationSerializer(serializers.ModelSerializer):
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    rfq_channel = serializers.PrimaryKeyRelatedField(
        queryset=RFQChannel.objects.all(), allow_null=True
    )
    assigned_sales_person = serializers.PrimaryKeyRelatedField(
        queryset=TeamMember.objects.all(), allow_null=True
    )
    items = QuotationItemSerializer(many=True, required=True)
    terms = QuotationTermsSerializer(read_only=True)
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
    assigned_sales_person_name = serializers.CharField(
        source="assigned_sales_person.name", read_only=True
    )
    assigned_sales_person_email = serializers.CharField(
        source="assigned_sales_person.email", read_only=True
    )
    not_approved_reason_remark = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    subtotal = serializers.SerializerMethodField()
    vat_amount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            "id",
            "rfq",
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
            "quotation_status",
            "next_followup_date",
            "followup_frequency",
            "remarks",
            "series_number",
            "created_at",
            "items",
            "terms",
            "purchase_orders",
            "assigned_sales_person_name",
            "assigned_sales_person_email",
            "not_approved_reason_remark",
            "email_sent",
            "vat_applicable",
            "subtotal",
            "vat_amount",
            "grand_total",
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return rep

    def get_subtotal(self, obj):
        return float(obj.get_subtotal())

    def get_vat_amount(self, obj):
        return float(obj.get_vat_amount())

    def get_grand_total(self, obj):
        return float(obj.get_grand_total())

    def get_purchase_orders(self, obj):
        pos = PurchaseOrder.objects.filter(quotation=obj)
        return PurchaseOrderSerializer(pos, many=True).data

    def send_submission_email(self, quotation):
        email_sent = False
        recipient_list = []

        # Collect recipient emails (only Admin, Superadmin, and Assigned Sales Person)
        if quotation.assigned_sales_person and quotation.assigned_sales_person.email:
            recipient_list.append(
                (
                    quotation.assigned_sales_person.email,
                    quotation.assigned_sales_person.name,
                )
            )
        if settings.ADMIN_EMAIL:
            recipient_list.append(
                (settings.ADMIN_EMAIL, None)
            )  # Admin email with no specific name
        superadmin_role = Role.objects.filter(name="Superadmin").first()
        if superadmin_role:
            superadmin_users = CustomUser.objects.filter(role=superadmin_role)
            for user in superadmin_users:
                if user.email:
                    recipient_list.append((user.email, user.name or user.username))

        # Remove duplicates while preserving names
        recipient_dict = {email: name for email, name in recipient_list}
        recipient_list = [(email, name) for email, name in recipient_dict.items()]

        if recipient_list:
            for email, name in recipient_list:
                # Determine salutation
                if email == settings.ADMIN_EMAIL:
                    salutation = "Dear Admin"
                elif (
                    superadmin_role
                    and CustomUser.objects.filter(
                        email=email, role=superadmin_role
                    ).exists()
                ):
                    salutation = f"Dear {name}" if name else "Dear Superadmin"
                elif (
                    email
                    == (
                        quotation.assigned_sales_person.email
                        if quotation.assigned_sales_person
                        else None
                    )
                    and name
                ):
                    salutation = f"Dear {name}"
                else:
                    salutation = "Dear Recipient"

                subject = f"New Quotation Submitted: #{quotation.series_number}"
                message = (
                    f"{salutation},\n\n"
                    f"A new Quotation has been submitted in PrimeCRM:\n"
                    f"------------------------------------------------------------\n"
                    f"🔹 Quotation Number: {quotation.series_number}\n"
                    f'🔹 Project: {quotation.company_name or "Not specified"}\n'
                    f'🔹 Due Date: {quotation.due_date_for_quotation or "Not specified"}\n'
                    f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
                    f'🔹 Assigned To: {quotation.assigned_sales_person.name if quotation.assigned_sales_person else "Not assigned"}\n'
                    f'🔹 Company: {quotation.company_name or "Not specified"}\n'
                    f'🔹 Contact: {quotation.point_of_contact_name or "Not specified"} ({quotation.point_of_contact_email or "Not specified"})\n'
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
                    print(
                        f"Quotation submission email sent successfully to {email} for Quotation #{quotation.series_number}"
                    )
                except Exception as e:
                    print(
                        f"Failed to send quotation submission email to {email} for Quotation #{quotation.series_number}: {str(e)}"
                    )
        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        assigned_sales_person = validated_data.pop("assigned_sales_person", None)
        try:
            quotation_series = NumberSeries.objects.get(series_name="Quotation")
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Quotation series not found.")
        max_sequence = Quotation.objects.filter(
            series_number__startswith=quotation_series.prefix
        ).aggregate(Max("series_number"))["series_number__max"]
        sequence = 1
        if max_sequence:
            sequence = int(max_sequence.split("-")[-1]) + 1
        series_number = f"{quotation_series.prefix}-{sequence:06d}"
        if "followup_frequency" not in validated_data:
            validated_data["followup_frequency"] = "24_hours"
        quotation = Quotation.objects.create(
            series_number=series_number,
            assigned_sales_person=assigned_sales_person,
            **validated_data,
        )
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        email_sent = self.send_submission_email(quotation)
        quotation.email_sent = email_sent
        quotation.save()
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        assigned_sales_person = validated_data.get(
            "assigned_sales_person", instance.assigned_sales_person
        )
        not_approved_reason_remark = validated_data.get(
            "not_approved_reason_remark", instance.not_approved_reason_remark
        )
        if (
            validated_data.get("quotation_status") == "Not Approved"
            and not not_approved_reason_remark
        ):
            raise serializers.ValidationError(
                "A reason must be provided when setting status to 'Not Approved'."
            )
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if (
            validated_data.get("followup_frequency")
            and instance.followup_frequency != validated_data["followup_frequency"]
        ):
            today = timezone.now().date()
            if validated_data["followup_frequency"] == "24_hours":
                instance.next_followup_date = today + timedelta(days=1)
            elif validated_data["followup_frequency"] == "3_days":
                instance.next_followup_date = today + timedelta(days=3)
            elif validated_data["followup_frequency"] == "7_days":
                instance.next_followup_date = today + timedelta(days=7)
            elif validated_data["followup_frequency"] == "every_7th_day":
                instance.next_followup_date = today + timedelta(days=7)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["email_sent"] = getattr(instance, "email_sent", False)
        return representation


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