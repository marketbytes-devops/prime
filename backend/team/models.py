from django.db import models

class TeamMember(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="Name of the team member")
    designation = models.CharField(max_length=100, null=True, blank=True, help_text="Designation of the team member")
    email = models.EmailField(null=True, blank=True, unique=True, help_text="email of the team member")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.designation}"

    class Meta:
        ordering = ['-created_at']