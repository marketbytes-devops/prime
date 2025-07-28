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
from datetime import date, timedelta

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

    def validate(self, data):
        if not data.get('purchase_order') and not data.get('quotation'):
            raise serializers.ValidationError("Either purchase_order or quotation must be provided.")
        return data

    def send_assignment_email(self, work_order, assigned_to):
        email_sent = False
        if assigned_to and assigned_to.email:
            subject = f'You Have Been Assigned to Work Order #{work_order.wo_number}'
            message = (
                f'Dear {assigned_to.name},\n\n'
                f'You have been assigned to the following Work Order:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Work Order Number: {work_order.wo_number}\n'
                f'🔹 Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'🔹 Status: {work_order.status}\n'
                f'🔹 Expected Completion Date: {work_order.expected_completion_date or "Not specified"}\n'
                f'------------------------------------------------------------\n'
                f'Please log in to your PrimeCRM dashboard to view the details and take the necessary actions.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,
                    recipient_list=[assigned_to.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Email sent successfully to {assigned_to.email} for Work Order #{work_order.wo_number}")
            except Exception as e:
                print(f"Failed to send email to {assigned_to.email} for Work Order #{work_order.wo_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Work Order Assignment Notification – #{work_order.wo_number}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following Work Order has been assigned:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Work Order Number: {work_order.wo_number}\n'
                f'🔹 Assigned To: {assigned_to.name} ({assigned_to.email})\n'
                f'🔹 Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'🔹 Status: {work_order.status}\n'
                f'🔹 Expected Completion Date: {work_order.expected_completion_date or "Not specified"}\n'
                f'------------------------------------------------------------\n'
                f'Please take any necessary actions or follow up as required.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Email sent successfully to {admin_email} for Work Order #{work_order.wo_number}")
            except Exception as e:
                print(f"Failed to send email to {admin_email} for Work Order #{work_order.wo_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_calibration_due_reminder(self, work_order, item, assigned_to):
        email_sent = False
        if (assigned_to and assigned_to.email and
                item.calibration_due_date and
                item.calibration_due_date == date.today()):
            subject = f'Reminder: Calibration Due for Work Order #{work_order.wo_number}'
            message = (
                f'Dear {assigned_to.name},\n\n'
                f'The calibration due date for the following item in Work Order #{work_order.wo_number} is today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Item: {item.item.name if item.item else "N/A"}\n'
                f'🔹 Certificate Number: {item.certificate_number or "N/A"}\n'
                f'🔹 Calibration Due Date: {item.calibration_due_date}\n'
                f'🔹 Work Order Number: {work_order.wo_number}\n'
                f'🔹 Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'------------------------------------------------------------\n'
                f'Please ensure the necessary actions are taken. '
                f'Log in to your PrimeCRM dashboard for details.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,
                    recipient_list=[assigned_to.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Calibration due reminder sent successfully to {assigned_to.email} for Work Order #{work_order.wo_number}")
            except Exception as e:
                print(f"Failed to send calibration due reminder to {assigned_to.email} for Work Order #{work_order.wo_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Calibration Due Notification – Work Order #{work_order.wo_number}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'The calibration due date for the following item in Work Order #{work_order.wo_number} is today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Item: {item.item.name if item.item else "N/A"}\n'
                f'🔹 Certificate Number: {item.certificate_number or "N/A"}\n'
                f'🔹 Calibration Due Date: {item.calibration_due_date}\n'
                f'🔹 Assigned To: {assigned_to.name} ({assigned_to.email})\n'
                f'🔹 Project: {work_order.quotation.company_name or "Unnamed"}\n'
                f'------------------------------------------------------------\n'
                f'Please take any necessary actions or follow up as required.\n\n'
                f'Best regards,\n'
                f'PrimeCRM Team\n'
                f'---\n'
                f'This is an automated message. Please do not reply to this email.'
            )
            try:
                send_mail(
                    subject=admin_subject,
                    message=admin_message,
                    from_email=None,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
                print(f"Calibration due reminder sent successfully to {admin_email} for Work Order #{work_order.wo_number}")
            except Exception as e:
                print(f"Failed to send calibration due reminder to {admin_email} for Work Order #{work_order.wo_number}: {str(e)}")
                email_sent = False

        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assigned_to = validated_data.pop('assigned_to', None)
        created_by = validated_data.pop('created_by', None)
        
        try:
            wo_series = NumberSeries.objects.get(series_name='WorkOrder')
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Work Order series not found.")
        max_sequence = WorkOrder.objects.filter(wo_number__startswith=wo_series.prefix).aggregate(
            Max('wo_number')
        )['wo_number__max']
        sequence = 1
        if max_sequence:
            sequence = int(max_sequence.split('-')[-1]) + 1
        wo_number = f"{wo_series.prefix}-{sequence:06d}"

        work_order = WorkOrder.objects.create(
            wo_number=wo_number,
            assigned_to=assigned_to,
            created_by=created_by,
            **validated_data
        )

        if work_order.purchase_order:
            for item in work_order.purchase_order.items.all():
                WorkOrderItem.objects.create(
                    work_order=work_order,
                    item=item.item,
                    quantity=item.quantity,
                    unit=item.unit,
                    unit_price=item.unit_price
                )
        else:
            for item_data in items_data:
                WorkOrderItem.objects.create(work_order=work_order, **item_data)

        if assigned_to:
            self.send_assignment_email(work_order, assigned_to)

        return work_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        assigned_to = validated_data.get('assigned_to', instance.assigned_to)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                WorkOrderItem.objects.create(work_order=instance, **item_data)

        if assigned_to and (not instance.assigned_to or instance.assigned_to.id != assigned_to.id):
            self.send_assignment_email(instance, assigned_to)

        return instance