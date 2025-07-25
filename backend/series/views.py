from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import NumberSeries
from .serializers import NumberSeriesSerializer

class NumberSeriesViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = NumberSeries.objects.all()
    serializer_class = NumberSeriesSerializer