from rest_framework import serializers
from .models import RFQChannel

class RFQChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQChannel
        fields = ['id', 'channel_name']