from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import TeamMember
from .serializers import TeamMemberSerializer

class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [AllowAny]