from django.db import models

class RFQChannel(models.Model):
    channel_name = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="The name of the RFQ channel (e.g., WhatsApp, Email)")

    def __str__(self):
        return self.channel_name