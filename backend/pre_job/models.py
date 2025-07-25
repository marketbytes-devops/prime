from django.db import models
from datetime import timedelta
from django.utils import timezone

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

class Quotation(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='quotations')
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
    quotation_status = models.CharField(
        max_length=20,
        choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('PO Created', 'PO Created')],
        default='Pending'
    )
    next_followup_date = models.DateField(null=True, blank=True)
    followup_frequency = models.CharField(
        max_length=20,
        choices=[('24_hours', '24 Hours'), ('3_days', '3 Days'), ('7_days', '7 Days'), ('every_7th_day', 'Every 7th Day')],
        default='24_hours'
    )
    remarks = models.TextField(null=True, blank=True)
    series_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quotation {self.id} - {self.company_name or 'Unnamed'}"

    def save(self, *args, **kwargs):
        if not self.next_followup_date:
            today = self.created_at.date() if self.created_at else timezone.now().date()
            if self.followup_frequency == '24_hours':
                self.next_followup_date = today + timedelta(days=1)
            elif self.followup_frequency == '3_days':
                self.next_followup_date = today + timedelta(days=3)
            elif self.followup_frequency == '7_days':
                self.next_followup_date = today + timedelta(days=7)
            elif self.followup_frequency == 'every_7th_day':
                self.next_followup_date = today + timedelta(days=7)
        super().save(*args, **kwargs)


class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey('item.Item', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(null=True, blank=True)
    unit = models.ForeignKey('unit.Unit', on_delete=models.SET_NULL, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.item} - {self.quotation}"