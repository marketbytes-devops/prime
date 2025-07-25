from django.db import models

class RFQ(models.Model):
    company_name = models.CharField(max_length=100, null=True, blank=True)
    company_address = models.TextField(null=True, blank=True)
    company_phone = models.CharField(max_length=20, null=True, blank=True)
    company_email = models.EmailField(null=True, blank=True)
    rfq_channel = models.ForeignKey('channels.RFQChannel', on_delete=models.SET_NULL, null=True, blank=True)
    point_of_contact_name = models.CharField(max_length=100, null=True, blank=True)
    point_of_contact_email = models.EmailField(null=True, blank=True)
    point_of_contact_phone = models.CharField(max_length=20, null=True, blank=True)
    assigned_sales_person = models.ForeignKey('team.TeamMember', on_delete=models.SET_NULL, null=True, blank=True)
    due_date_for_quotation = models.DateField(null=True, blank=True)
    rfq_status = models.CharField(
        max_length=20,
        choices=[('Processing', 'Processing'), ('Completed', 'Completed')],
        null=True,
        blank=True
    )
    series_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RFQ {self.id} - {self.company_name or 'Unnamed'}"

class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey('item.Item', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(null=True, blank=True)
    unit = models.ForeignKey('unit.Unit', on_delete=models.SET_NULL, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.item} - {self.rfq}"