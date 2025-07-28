from django.db import models
from django.utils import timezone
from pre_job.models import PurchaseOrder, Quotation
from team.models import TeamMember
from item.models import Item
from unit.models import Unit

class WorkOrder(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='work_orders', null=True, blank=True)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='work_orders', null=True, blank=True)
    wo_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    assigned_to = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='work_orders')
    status = models.CharField(
        max_length=20,
        choices=[('Collection Pending', 'Collection Pending'), ('Collected', 'Collected'), ('Processing', 'Processing'), ('Manager Approval', 'Manager Approval'), ('Approved', 'Approved'), ('Declined', 'Declined'), ('Delivered', 'Delivered'), ('Closed', 'Closed')],
        default='Collection Pending'
    )
    date_received = models.DateField(null=True, blank=True)
    expected_completion_date = models.DateField(null=True, blank=True)
    onsite_or_lab = models.CharField(max_length=20, choices=[('Onsite', 'Onsite'), ('Lab', 'Lab')], null=True, blank=True)
    range = models.CharField(max_length=100, null=True, blank=True)
    serial_number = models.CharField(max_length=100, null=True, blank=True)
    site_location = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(TeamMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_work_orders')
    manager_approval_status = models.CharField(
        max_length=20,
        choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Declined', 'Declined')],
        default='Pending'
    )
    decline_reason = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"WO {self.wo_number} - {self.quotation.company_name or 'Unnamed'}"

class WorkOrderItem(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    certificate_number = models.CharField(max_length=100, null=True, blank=True)
    calibration_date = models.DateField(null=True, blank=True)
    calibration_due_date = models.DateField(null=True, blank=True)
    uuc_serial_number = models.CharField(max_length=100, null=True, blank=True)
    certificate_file = models.FileField(upload_to='certificates/', null=True, blank=True)

    def __str__(self):
        return f"{self.item} - {self.work_order}"

class DeliveryNote(models.Model):
    work_order = models.OneToOneField(WorkOrder, on_delete=models.CASCADE, related_name='delivery_note')
    dn_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    signed_delivery_note = models.FileField(upload_to='delivery_notes/', null=True, blank=True)
    delivery_status = models.CharField(
        max_length=20,
        choices=[('Delivery Pending', 'Delivery Pending'), ('Delivered', 'Delivered')],
        default='Delivery Pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"DN {self.dn_number} - {self.work_order.wo_number}"