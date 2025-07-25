from rest_framework import serializers
from .models import RFQ, RFQItem
from item.models import Item
from unit.models import Unit
from channels.models import RFQChannel
from team.models import TeamMember
from series.models import NumberSeries
from django.db.models import Max

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

class RFQSerializer(serializers.ModelSerializer):
    rfq_channel = serializers.PrimaryKeyRelatedField(queryset=RFQChannel.objects.all(), allow_null=True)
    assigned_sales_person = serializers.PrimaryKeyRelatedField(queryset=TeamMember.objects.all(), allow_null=True)
    items = RFQItemSerializer(many=True, required=False)

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