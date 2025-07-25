from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Unit
from .serializers import UnitSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [AllowAny]