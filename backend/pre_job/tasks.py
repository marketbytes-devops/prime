from celery import shared_task
from django.core.mail import send_mail
from job_execution.models import Invoice
from django.conf import settings
from authapp.models import Role, CustomUser
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_rfq_creation_email_task(self, rfq_data, recipients):
    """
    Send email notification for new RFQ creation
    recipients: list of tuples [(email, name), (email, name), ...]
    """
    try:
        subject = f"New RFQ Created: #{rfq_data['series_number']}"
        
        sent = False
        for email, recipient_name in recipients:  # Fixed: use recipient_name instead of name
            try:
                message = (
                    f"Dear {recipient_name},\n\n"
                    f"A new Request for Quotation (RFQ) has been created in PrimeCRM:\n"
                    f"------------------------------------------------------------\n"
                    f"RFQ Number: {rfq_data['series_number']}\n"
                    f"Project: {rfq_data.get('company_name', 'Not specified')}\n"
                    f"Due Date: {rfq_data.get('due_date', 'Not specified')}\n"
                    f"Assigned To: {rfq_data.get('assigned_name', 'Not assigned')}\n"
                    f"Company: {rfq_data.get('company_name', 'Not specified')}\n"
                    f"Contact: {rfq_data.get('contact_name', 'Not specified')}\n"
                    f"Contact Email: {rfq_data.get('contact_email', 'Not specified')}\n"
                    f"------------------------------------------------------------\n"
                    f"Please log in to PrimeCRM to view details.\n\n"
                    f"Best regards,\nPrimeCRM Team"
                )
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                sent = True
                logger.info(f"RFQ email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send RFQ email to {email}: {e}")

        return sent

    except Exception as exc:
        logger.error(f"RFQ email task failed: {exc}")
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_quotation_submission_email_task(self, quotation_data, recipients):
    """
    Send email notification for new quotation submission
    recipients: list of tuples [(email, name), (email, name), ...]
    """
    try:
        subject = f"New Quotation Submitted: #{quotation_data.get('series_number', 'N/A')}"
        
        sent = False
        for email, recipient_name in recipients:  # Fixed: use recipient_name instead of name
            try:
                message = (
                    f"Dear {recipient_name},\n\n"
                    f"A new quotation has been submitted in PrimeCRM:\n"
                    f"------------------------------------------------------------\n"
                    f"Quotation No: {quotation_data.get('series_number', 'N/A')}\n"
                    f"Company: {quotation_data.get('company_name', 'Not specified')}\n"
                    f"Contact: {quotation_data.get('contact_name', 'Not specified')} "
                    f"({quotation_data.get('contact_email', 'Not specified')})\n"
                    f"Assigned To: {quotation_data.get('assigned_name', 'Not assigned')}\n"
                    f"Status: {quotation_data.get('status', 'Pending')}\n"
                    f"------------------------------------------------------------\n"
                    f"Please log in to review.\n\n"
                    f"Best regards,\nPrimeCRM System"
                )
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                sent = True
                logger.info(f"Quotation email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send quotation email to {email}: {e}")
                # Don't retry for individual email failures, only for overall task failure

        return sent

    except Exception as exc:
        logger.error(f"Quotation email task failed: {exc}")
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_invoice_status_email_task(self, invoice_id, new_status):
    """
    Send email notification for invoice status update
    """
    try:
        from job_execution.models import Invoice  # Import here to avoid circular imports
        
        invoice = Invoice.objects.get(id=invoice_id)
        logger.info(f"Sending invoice status email: {new_status} for Invoice #{invoice.id}")

        subject = f"Invoice Status Updated: {new_status.title()}"
        message = (
            f"Dear Team,\n\n"
            f"The invoice status has been updated:\n"
            f"------------------------------------------------\n"
            f"Invoice ID: {invoice.id}\n"
            f"Delivery Note: {invoice.delivery_note.dn_number if invoice.delivery_note else 'N/A'}\n"
            f"New Status: {new_status.title()}\n"
            f"{'Due in ' + str(invoice.due_in_days) + ' days' if new_status == 'raised' and invoice.due_in_days else ''}\n"
            f"{'Received on: ' + invoice.received_date.strftime('%Y-%m-%d') if new_status == 'processed' else ''}\n"
            f"------------------------------------------------\n"
            f"Please check the system.\n\n"
            f"Best regards,\nPrimeCRM System"
        )

        recipients = []
        if settings.ADMIN_EMAIL:
            recipients.append(settings.ADMIN_EMAIL)
        
        sent = False
        for email in recipients:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                sent = True
                logger.info(f"Invoice status email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send invoice email to {email}: {e}")

        return sent

    except Exception as e:
        logger.error(f"Failed to send invoice email: {e}")
        raise self.retry(exc=e)