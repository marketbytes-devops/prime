from rest_framework import serializers
from .models import RFQ, RFQItem, Quotation, QuotationItem
from item.models import Item
from unit.models import Unit
from channels.models import RFQChannel
from team.models import TeamMember
from series.models import NumberSeries
from django.db.models import Max
from django.utils import timezone
from datetime import timedelta

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

class RFQSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.PrimaryKeyRelatedField(queryset=RFQChannel.objects.all(), allow_null=True)
    assigned_sales_person = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = RFQItemSerializer(many=True, required=False)
    rfq_status = serializers.ChoiceField(choices=[('Processing', 'Processing'), ('Completed', 'Completed')], allow_null=True, required=False)

    class Meta:
        model = RFQ
        fields = [
            'id', 'company_name', 'company_address', 'company_phone', 'company_email',
            'rfq_channel', 'point_of_contact_name', 'point_of_contact_email',
            'point_of_contact_phone', 'assigned_sales_person', 'due_date_for_quotation',
            'rfq_status', 'series_number', 'created_at', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
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

        rfq = RFQ.objects.create(series_number=series_number, **validated_data)
        for item_data in items_data:
            RFQItem.objects.create(rfq=rfq, **item_data)
        return rfq

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                RFQItem.objects.create(rfq=instance, **item_data)
        return instance

class QuotationSerializer(serializers.ModelSerializer):
    rfq = serializers.PrimaryKeyRelatedField(queryset=RFQ.objects.all())
    rfq_channel = serializers.PrimaryKeyRelatedField(queryset=RFQChannel.objects.all(), allow_null=True)
    assigned_sales_person = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = QuotationItemSerializer(many=True, required=True)
    quotation_status = serializers.ChoiceField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('PO Created', 'PO Created')], required=False)
    followup_frequency = serializers.ChoiceField(choices=[('24_hours', '24 Hours'), ('3_days', '3 Days'), ('7_days', '7 Days'), ('every_7th_day', 'Every 7th Day')], required=False)

    class Meta:
        model = Quotation
        fields = [
            'id', 'rfq', 'company_name', 'company_address', 'company_phone', 'company_email',
            'rfq_channel', 'point_of_contact_name', 'point_of_contact_email',
            'point_of_contact_phone', 'assigned_sales_person', 'due_date_for_quotation',
            'quotation_status', 'next_followup_date', 'followup_frequency', 'remarks',
            'series_number', 'created_at', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
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

        quotation = Quotation.objects.create(series_number=series_number, **validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
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
        return instance