from rest_framework import serializers
from .models import RFQ, RFQItem, Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem
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

class RFQItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), allow_null=True)
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = RFQItem
        fields = ['id', 'item', 'quantity', 'unit', 'unit_price', 'total_price']

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

class QuotationItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), allow_null=True)
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = QuotationItem
        fields = ['id', 'item', 'quantity', 'unit', 'unit_price', 'total_price']

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), allow_null=True)
    unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), allow_null=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'item', 'quantity', 'unit', 'unit_price', 'total_price']

    def get_total_price(self, obj):
        if obj.quantity and obj.unit_price:
            return obj.quantity * obj.unit_price
        return 0

class RFQSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.PrimaryKeyRelatedField(queryset=RFQChannel.objects.all(), allow_null=True)
    assigned_sales_person = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = RFQItemSerializer(many=True, required=False)
    rfq_status = serializers.ChoiceField(choices=[('Processing', 'Processing'), ('Completed', 'Completed')], allow_null=True, required=False)
    assigned_sales_person_name = serializers.CharField(source='assigned_sales_person.name', read_only=True)
    assigned_sales_person_email = serializers.CharField(source='assigned_sales_person.email', read_only=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'company_name', 'company_address', 'company_phone', 'company_email',
            'rfq_channel', 'point_of_contact_name', 'point_of_contact_email',
            'point_of_contact_phone', 'assigned_sales_person', 'due_date_for_quotation',
            'series_number', 'created_at', 'items', 'rfq_status',
            'assigned_sales_person_name', 'assigned_sales_person_email'
        ]

    def validate_assigned_sales_person(self, value):
        if value and not value.email:
            raise serializers.ValidationError("Selected team member must have a valid email address.")
        return value

    def send_assignment_email(self, rfq, assigned_sales_person):
        email_sent = False
        if assigned_sales_person and assigned_sales_person.email:
            subject = f'You Have Been Assigned to RFQ #{rfq.series_number}'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'You have been assigned to the following Request for Quotation (RFQ):\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation or "Not specified"}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Email sent successfully to {assigned_sales_person.email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send email to {assigned_sales_person.email} for RFQ #{rfq.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ Assignment Notification – #{rfq.series_number}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ has been assigned:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation or "Not specified"}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
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
                print(f"Email sent successfully to {admin_email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send email to {admin_email} for RFQ #{rfq.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_due_date_reminder(self, rfq, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                rfq.due_date_for_quotation == date.today() and
                rfq.rfq_status != 'Completed'):
            # Email to assigned person
            subject = f'Reminder: RFQ #{rfq.series_number} Due Today'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'Your due date for the following Request for Quotation (RFQ) is ending today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please ensure all necessary actions are completed promptly. '
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Reminder email sent successfully to {assigned_sales_person.email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send reminder email to {assigned_sales_person.email} for RFQ #{rfq.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ #{rfq.series_number} Due Today Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ is due today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
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
                print(f"Reminder email sent successfully to {admin_email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send reminder email to {admin_email} for RFQ #{rfq.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_past_due_alert(self, rfq, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                rfq.due_date_for_quotation and
                rfq.due_date_for_quotation < date.today() and
                rfq.rfq_status != 'Completed'):
            # Email to assigned person
            subject = f'Alert: RFQ #{rfq.series_number} Past Due'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'The due date for the following Request for Quotation (RFQ) has passed:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
                f'------------------------------------------------------------\n'
                f'Please take immediate action to address this. '
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Past due alert email sent successfully to {assigned_sales_person.email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send past due alert email to {assigned_sales_person.email} for RFQ #{rfq.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'RFQ #{rfq.series_number} Past Due Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following RFQ is past due:\n'
                f'------------------------------------------------------------\n'
                f'🔹 RFQ Number: {rfq.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {rfq.company_name or ""}\n'
                f'🔹 Due Date: {rfq.due_date_for_quotation}\n'
                f'🔹 Status: {rfq.rfq_status or "Processing"}\n'
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
                print(f"Past due alert email sent successfully to {admin_email} for RFQ #{rfq.series_number}")
            except Exception as e:
                print(f"Failed to send past due alert email to {admin_email} for RFQ #{rfq.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assigned_sales_person = validated_data.pop('assigned_sales_person', None)
        try:
            quotation_series = NumberSeries.objects.get(series_name='Quotation')
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Quotation series not found.")
        max_sequence = RFQ.objects.filter(series_number__startswith=quotation_series.prefix).aggregate(
            Max('series_number')
        )['series_number__max']
        sequence = 1
        if max_sequence:
            sequence = int(max_sequence.split('-')[-1]) + 1
        series_number = f"{quotation_series.prefix}-{sequence:06d}"

        rfq = RFQ.objects.create(series_number=series_number, assigned_sales_person=assigned_sales_person, **validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        if assigned_sales_person:
            email_sent = self.send_assignment_email(rfq, assigned_sales_person)
            rfq.email_sent = email_sent
            rfq.save()
        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        assigned_sales_person = validated_data.get('assigned_sales_person', instance.assigned_sales_person)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                RFQItem.objects.create(rfq=instance, **item_data)
        if assigned_sales_person and (not instance.assigned_sales_person or instance.assigned_sales_person.id != assigned_sales_person.id):
            email_sent = self.send_assignment_email(instance, assigned_sales_person)
            instance.email_sent = email_sent
            instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email_sent'] = getattr(instance, 'email_sent', False)
        return representation

class QuotationSerializer(serializers.ModelSerializer):
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    rfq_channel = serializers.PrimaryKeyRelatedField(queryset=RFQChannel.objects.all(), allow_null=True)
    assigned_sales_person = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = QuotationItemSerializer(many=True, required=True)
    quotation_status = serializers.ChoiceField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('PO Created', 'PO Created')], required=False)
    followup_frequency = serializers.ChoiceField(choices=[('24_hours', '24 Hours'), ('3_days', '3 Days'), ('7_days', '7 Days'), ('every_7th_day', 'Every 7th Day')], required=False)
    purchase_orders = serializers.SerializerMethodField()
    assigned_sales_person_name = serializers.CharField(source='assigned_sales_person.name', read_only=True)
    assigned_sales_person_email = serializers.CharField(source='assigned_sales_person.email', read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'rfq', 'company_name', 'company_address', 'company_phone', 'company_email',
            'rfq_channel', 'point_of_contact_name', 'point_of_contact_email',
            'point_of_contact_phone', 'assigned_sales_person', 'due_date_for_quotation',
            'quotation_status', 'next_followup_date', 'followup_frequency', 'remarks',
            'series_number', 'created_at', 'items', 'purchase_orders',
            'assigned_sales_person_name', 'assigned_sales_person_email'
        ]

    def get_purchase_orders(self, obj):
        pos = PurchaseOrder.objects.filter(quotation=obj)
        return PurchaseOrderSerializer(pos, many=True).data

    def send_assignment_email(self, quotation, assigned_sales_person):
        email_sent = False
        if assigned_sales_person and assigned_sales_person.email:
            subject = f'You Have Been Assigned to Quotation #{quotation.series_number}'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'You have been assigned to the following Quotation:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Due Date: {quotation.due_date_for_quotation or "Not specified"}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Email sent successfully to {assigned_sales_person.email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send email to {assigned_sales_person.email} for Quotation #{quotation.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Quotation Assignment Notification – #{quotation.series_number}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following Quotation has been assigned:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Due Date: {quotation.due_date_for_quotation or "Not specified"}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
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
                print(f"Email sent successfully to {admin_email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send email to {admin_email} for Quotation #{quotation.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_followup_reminder(self, quotation, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                quotation.next_followup_date == date.today() and
                quotation.quotation_status != 'PO Created'):
            # Email to assigned person
            subject = f'Reminder: Quotation #{quotation.series_number} Follow-up Due Today'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'Your follow-up for the following Quotation is due today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
                f'------------------------------------------------------------\n'
                f'Please ensure all necessary actions are completed promptly. '
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Follow-up reminder email sent successfully to {assigned_sales_person.email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send follow-up reminder email to {assigned_sales_person.email} for Quotation #{quotation.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Quotation #{quotation.series_number} Follow-up Due Today Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following Quotation has a follow-up due today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
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
                print(f"Follow-up reminder email sent successfully to {admin_email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send follow-up reminder email to {admin_email} for Quotation #{quotation.series_number}: {str(e)}")
                email_sent = False

            # Update next_followup_date if frequency is 'every_7th_day'
            if quotation.followup_frequency == 'every_7th_day':
                quotation.next_followup_date = date.today() + timedelta(days=7)
                quotation.save()

        return email_sent

    def send_past_due_alert(self, quotation, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                quotation.next_followup_date and
                quotation.next_followup_date < date.today() and
                quotation.quotation_status != 'PO Created'):
            # Email to assigned person
            subject = f'Alert: Quotation #{quotation.series_number} Follow-up Past Due'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'The follow-up date for the following Quotation has passed:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
                f'------------------------------------------------------------\n'
                f'Please take immediate action to address this. '
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"Past due alert email sent successfully to {assigned_sales_person.email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send past due alert email to {assigned_sales_person.email} for Quotation #{quotation.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Quotation #{quotation.series_number} Follow-up Past Due Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following Quotation is past due for follow-up:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status or "Pending"}\n'
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
                print(f"Past due alert email sent successfully to {admin_email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send past due alert email to {admin_email} for Quotation #{quotation.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_po_followup_reminder(self, quotation, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                quotation.quotation_status == 'Approved' and
                not quotation.purchase_orders.exists() and
                quotation.next_followup_date == date.today()):
            # Email to assigned person
            subject = f'Reminder: Follow-up on Purchase Order for Quotation #{quotation.series_number}'
            message = (
                f'Dear {assigned_sales_person.name},\n\n'
                f'The following Quotation has been approved but no Purchase Order has been received yet:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status}\n'
                f'------------------------------------------------------------\n'
                f'Please follow up with the client to obtain the Purchase Order. '
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
                    recipient_list=[assigned_sales_person.email],
                    fail_silently=True,
                )
                email_sent = True
                print(f"PO follow-up reminder email sent successfully to {assigned_sales_person.email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send PO follow-up reminder email to {assigned_sales_person.email} for Quotation #{quotation.series_number}: {str(e)}")

            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Quotation #{quotation.series_number} PO Follow-up Due Today Notification'
            admin_message = (
                f'Dear Admin,\n\n'
                f'We would like to inform you that the following Quotation has a PO follow-up due today:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status}\n'
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
                print(f"PO follow-up reminder email sent successfully to {admin_email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send PO follow-up reminder email to {admin_email} for Quotation #{quotation.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def send_po_past_due_alert(self, quotation, assigned_sales_person):
        email_sent = False
        if (assigned_sales_person and assigned_sales_person.email and
                quotation.quotation_status == 'Approved' and
                not quotation.purchase_orders.exists() and
                quotation.next_followup_date and
                quotation.next_followup_date < date.today()):
            # Email to admin
            admin_email = settings.ADMIN_EMAIL
            admin_subject = f'Alert: No Purchase Order Received for Quotation #{quotation.series_number}'
            admin_message = (
                f'Dear Admin,\n\n'
                f'The following Quotation has been approved but no Purchase Order has been received, and the follow-up date has passed:\n'
                f'------------------------------------------------------------\n'
                f'🔹 Quotation Number: {quotation.series_number}\n'
                f'🔹 Assigned To: {assigned_sales_person.name} ({assigned_sales_person.email})\n'
                f'🔹 Project: {quotation.company_name or ""}\n'
                f'🔹 Next Follow-up Date: {quotation.next_followup_date}\n'
                f'🔹 Status: {quotation.quotation_status}\n'
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
                email_sent = True
                print(f"PO past due alert email sent successfully to {admin_email} for Quotation #{quotation.series_number}")
            except Exception as e:
                print(f"Failed to send PO past due alert email to {admin_email} for Quotation #{quotation.series_number}: {str(e)}")
                email_sent = False

        return email_sent

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        assigned_sales_person = validated_data.pop('assigned_sales_person', None)
        try:
            quotation_series = NumberSeries.objects.get(series_name='Quotation')
        except NumberSeries.DoesNotExist:
            raise serializers.ValidationError("Quotation series not found.")
        max_sequence = Quotation.objects.filter(series_number__startswith=quotation_series.prefix).aggregate(
            Max('series_number')
        )['series_number__max']
        sequence = 1
        if max_sequence:
            sequence = int(max_sequence.split('-')[-1]) + 1
        series_number = f"{quotation_series.prefix}-{sequence:06d}"

        # Set default followup_frequency to '24_hours' if not provided
        if 'followup_frequency' not in validated_data:
            validated_data['followup_frequency'] = '24_hours'

        quotation = Quotation.objects.create(series_number=series_number, assigned_sales_person=assigned_sales_person, **validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        
        if assigned_sales_person:
            email_sent = self.send_assignment_email(quotation, assigned_sales_person)
            quotation.email_sent = email_sent
            quotation.save()
        
        # Send initial follow-up reminder if applicable
        if quotation.next_followup_date == date.today() and quotation.quotation_status != 'PO Created':
            self.send_followup_reminder(quotation, assigned_sales_person)
        
        # Send PO follow-up reminder if quotation is approved and no PO exists
        if quotation.quotation_status == 'Approved' and not quotation.purchase_orders.exists():
            self.send_po_followup_reminder(quotation, assigned_sales_person)
        
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        assigned_sales_person = validated_data.get('assigned_sales_person', instance.assigned_sales_person)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update next_followup_date based on followup_frequency
        if validated_data.get('followup_frequency') and instance.followup_frequency != validated_data['followup_frequency']:
            today = timezone.now().date()
            if validated_data['followup_frequency'] == '24_hours':
                instance.next_followup_date = today + timedelta(days=1)
            elif validated_data['followup_frequency'] == '3_days':
                instance.next_followup_date = today + timedelta(days=3)
            elif validated_data['followup_frequency'] == '7_days':
                instance.next_followup_date = today + timedelta(days=7)
            elif validated_data['followup_frequency'] == 'every_7th_day':
                instance.next_followup_date = today + timedelta(days=7)
        
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
        
        # Send assignment email if sales person changed
        if assigned_sales_person and (not instance.assigned_sales_person or instance.assigned_sales_person.id != assigned_sales_person.id):
            email_sent = self.send_assignment_email(instance, assigned_sales_person)
            instance.email_sent = email_sent
            instance.save()
        
        # Send follow-up reminders and alerts
        if instance.next_followup_date == date.today() and instance.quotation_status != 'PO Created':
            self.send_followup_reminder(instance, assigned_sales_person)
        
        if instance.next_followup_date and instance.next_followup_date < date.today() and instance.quotation_status != 'PO Created':
            self.send_past_due_alert(instance, assigned_sales_person)
        
        # Send PO follow-up reminder and past due alert
        if instance.quotation_status == 'Approved' and not instance.purchase_orders.exists():
            if instance.next_followup_date == date.today():
                self.send_po_followup_reminder(instance, assigned_sales_person)
            if instance.next_followup_date and instance.next_followup_date < date.today():
                self.send_po_past_due_alert(instance, assigned_sales_person)
        
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email_sent'] = getattr(instance, 'email_sent', False)
        return representation

class PurchaseOrderSerializer(serializers.ModelSerializer):
    quotation = serializers.PrimaryKeyRelatedField(queryset=Quotation.objects.all())
    items = PurchaseOrderItemSerializer(many=True, required=False)
    order_type = serializers.ChoiceField(choices=[('full', 'Full'), ('partial', 'Partial')], default='full')
    client_po_number = serializers.CharField(max_length=100, allow_blank=True, required=False)
    po_file = serializers.FileField(required=False, allow_null=True)
    series_number = serializers.CharField(max_length=50, read_only=True)  # Added read-only field

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'quotation', 'order_type', 'client_po_number', 'po_file',
            'created_at', 'items', 'series_number'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not items_data and 'items' in self.context['request'].POST:
            try:
                items_data = json.loads(self.context['request'].POST.get('items', '[]'))
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for items.")

        quotation = validated_data['quotation']
        purchase_order = PurchaseOrder.objects.create(**validated_data)

        if validated_data['order_type'] == 'full':
            for item in quotation.items.all():
                PurchaseOrderItem.objects.create(
                    purchase_order=purchase_order,
                    item=item.item,
                    quantity=item.quantity,
                    unit=item.unit,
                    unit_price=item.unit_price
                )
        else:  # partial order
            for item_data in items_data:
                item_instance = None
                unit_instance = None
                # Handle item field
                item_id = item_data.get('item')
                if item_id is not None:
                    try:
                        item_instance = Item.objects.get(id=item_id)
                    except Item.DoesNotExist:
                        raise serializers.ValidationError(f"Item with ID {item_id} does not exist.")
                # Handle unit field
                unit_id = item_data.get('unit')
                if unit_id is not None:
                    try:
                        unit_instance = Unit.objects.get(id=unit_id)
                    except Unit.DoesNotExist:
                        raise serializers.ValidationError(f"Unit with ID {unit_id} does not exist.")
                PurchaseOrderItem.objects.create(
                    purchase_order=purchase_order,
                    item=item_instance,
                    quantity=item_data.get('quantity'),
                    unit=unit_instance,
                    unit_price=item_data.get('unit_price')
                )

        quotation_items = set(quotation.items.values_list('id', flat=True))
        po_items = set(
            PurchaseOrderItem.objects.filter(
                purchase_order__quotation=quotation
            ).values_list('item_id', flat=True)
        )
        if quotation_items.issubset(po_items):
            quotation.quotation_status = 'PO Created'
            quotation.save()

        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.order_type = validated_data.get('order_type', instance.order_type)
        instance.client_po_number = validated_data.get('client_po_number', instance.client_po_number)
        if 'po_file' in validated_data:
            instance.po_file = validated_data.get('po_file')
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_instance = None
                unit_instance = None
                # Handle item field
                item_id = item_data.get('item')
                if item_id is not None:
                    try:
                        item_instance = Item.objects.get(id=item_id)
                    except Item.DoesNotExist:
                        raise serializers.ValidationError(f"Item with ID {item_id} does not exist.")
                # Handle unit field
                unit_id = item_data.get('unit')
                if unit_id is not None:
                    try:
                        unit_instance = Unit.objects.get(id=unit_id)
                    except Unit.DoesNotExist:
                        raise serializers.ValidationError(f"Unit with ID {unit_id} does not exist.")
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    item=item_instance,
                    quantity=item_data.get('quantity'),
                    unit=unit_instance,
                    unit_price=item_data.get('unit_price')
                )

        return instance