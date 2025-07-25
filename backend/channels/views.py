from rest_framework import viewsets
from .models import RFQChannel
from .serializers import RFQChannelSerializer
from rest_framework.permissions import AllowAny

class RFQChannelViewSet(viewsets.ModelViewSet):
    queryset = RFQChannel.objects.all()
    serializer_class = RFQChannelSerializer
    permission_classes = [AllowAny]