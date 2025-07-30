from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import TeamMember,Technician
from .serializers import TeamMemberSerializer,TechnicianSerializer

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [AllowAny]
    
class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [AllowAny]