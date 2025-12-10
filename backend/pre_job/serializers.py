# serializers.py - FIXED VERSION
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
        fields = ["id", "content", "updated_at", "is_default"]


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


class QuotationSerializer(serializers.ModelSerializer):
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    rfq_channel = serializers.PrimaryKeyRelatedField(
        queryset=RFQChannel.objects.all(), allow_null=True
    )
    assigned_sales_person = serializers.PrimaryKeyRelatedField(
        queryset=TeamMember.objects.all(), allow_null=True
    )
    
    # FIXED: Use QuotationItemSerializer, not QuotationItem model
    items = QuotationItemSerializer(many=True, required=True)

    # Terms handling
    terms = QuotationTermsSerializer(read_only=True)
    terms_id = serializers.PrimaryKeyRelatedField(
        queryset=QuotationTerms.objects.all(),
        source="terms",
        write_only=True,
        required=False,
        allow_null=True,
    )
    
    # Add computed fields
    terms_content = serializers.SerializerMethodField()
    has_custom_terms = serializers.SerializerMethodField()

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
            "followup_frequency", "remarks", "series_number", "created_at", "items", 
            "terms", "terms_id", "terms_content", "has_custom_terms",
            "purchase_orders", "assigned_sales_person_name", "assigned_sales_person_email",
            "not_approved_reason_remark", "email_sent", "vat_applicable", "subtotal", "vat_amount", "grand_total",
        ]
        read_only_fields = ["terms_content", "has_custom_terms"]

    def get_terms_content(self, obj):
        """Get terms content - custom if exists, otherwise default"""
        if obj.terms:
            return obj.terms.content
        else:
            # Try to get default terms
            default_terms = QuotationTerms.objects.filter(is_default=True).first()
            if default_terms:
                return default_terms.content
            else:
                # Create default terms if they don't exist
                default_content = """Calibration Service General Terms and Conditions

Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.

Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer's tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.

If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.

Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.

Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.

Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.

Customers purchase order or written approval is required to start calibration.

Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.

If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.

Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.

PAYMENT: Payment to be made after 30 days

CONFIDENTIALITY: Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.

VAT is excluded from our quotation and will be charged at 15% extra.

For Prime Innovation Company
Hari Krishnan M
Head - Engineering and QA/QC"""
                
                # Create default terms
                default_terms = QuotationTerms.objects.create(
                    content=default_content,
                    is_default=True
                )
                return default_terms.content
        return ""

    def get_has_custom_terms(self, obj):
        """Check if quotation has custom terms"""
        return obj.terms is not None

    def get_subtotal(self, obj): 
        return float(obj.get_subtotal())
    
    def get_vat_amount(self, obj): 
        return float(obj.get_vat_amount())
    
    def get_grand_total(self, obj): 
        return float(obj.get_grand_total())
    
    def get_purchase_orders(self, obj):
        pos = PurchaseOrder.objects.filter(quotation=obj)
        return PurchaseOrderSerializer(pos, many=True).data

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        terms_data = validated_data.pop("terms", None)
        assigned_sales_person = validated_data.pop("assigned_sales_person", None)

        # Get RFQ instance
        rfq_instance = validated_data.pop('rfq')
        if not rfq_instance or not rfq_instance.series_number:
            raise serializers.ValidationError("Valid RFQ with series number is required")

        # Get prefix from NumberSeries
        try:
            quotation_series = NumberSeries.objects.get(series_name="Quotation")
            prefix = quotation_series.prefix
        except NumberSeries.DoesNotExist:
            prefix = "001-"

        # Extract running number from RFQ
        rfq_running_number = rfq_instance.series_number.split('-')[-1]
        series_number = f"{prefix}{rfq_running_number}"

        # Create quotation WITHOUT terms initially
        quotation = Quotation.objects.create(
            series_number=series_number,
            rfq=rfq_instance,
            assigned_sales_person=assigned_sales_person,
            **validated_data
        )

        # Handle terms: Only create custom terms if provided
        # Otherwise, leave terms as NULL (will use default via get_terms_content)
        if terms_data:
            # Create custom terms for this quotation
            terms_instance = QuotationTerms.objects.create(**terms_data)
            quotation.terms = terms_instance
            quotation.save()
        # If no terms provided, leave as NULL - will use default when needed

        # Create items
        if items_data:
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
        items_data = validated_data.pop("items", None)
        terms_data = validated_data.pop("terms", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle terms update
        if terms_data is not None:
            if instance.terms:
                # Update existing custom terms
                for attr, value in terms_data.items():
                    setattr(instance.terms, attr, value)
                instance.terms.save()
            else:
                # Create new custom terms
                instance.terms = QuotationTerms.objects.create(**terms_data)
        elif 'terms' in validated_data and validated_data['terms'] is None:
            # Explicitly setting terms to None - delete custom terms if they exist
            if instance.terms:
                instance.terms.delete()
                instance.terms = None

        # Update items if provided
        if items_data is not None:
            instance.items.all().delete()
            if items_data:  # Only create if there are items
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