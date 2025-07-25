from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Item
from .serializers import  ItemSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]