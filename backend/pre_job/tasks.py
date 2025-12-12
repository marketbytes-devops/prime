from celery import shared_task
from django.core.mail import send_mail
from job_execution.models import Invoice
from django.conf import settings
from authapp.models import Role, CustomUser
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_rfq_creation_email_task(self, rfq_data, recipients):
    try:
        subject = f"New RFQ Created: #{rfq_data['series_number']}"
        message = (
            f"Dear Recipient,\n\n"
            f"A new Request for Quotation (RFQ) has been created in PrimeCRM:\n"
            f"------------------------------------------------------------\n"
            f"RFQ Number: {rfq_data['series_number']}\n"
            f"Project: {rfq_data['company_name'] or 'Not specified'}\n"
            f"Due Date: {rfq_data['due_date'] or 'Not specified'}\n"
            f"Assigned To: {rfq_data['assigned_name'] or 'Not assigned'}\n"
            f"Company: {rfq_data['company_name'] or 'Not specified'}\n"
            f"Contact: {rfq_data['contact_name'] or 'Not specified'}\n"
            f"------------------------------------------------------------\n"
            f"Please log in to PrimeCRM to view details.\n\n"
            f"Best regards,\nPrimeCRM Team"
        )

        sent = False
        for email, name in recipients:
            try:
                # ❌ REMOVE 'name=' parameter
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
    logger.info(f"Starting Quotation email task for #{quotation_data['series_number']}")

    subject = f"New Quotation Submitted: #{quotation_data['series_number']}"
    message = (
        f"Dear Team,\n\n"
        f"A new quotation has been submitted in PrimeCRM:\n"
        f"------------------------------------------------------------\n"
        f"Quotation No: {quotation_data['series_number']}\n"
        f"Company: {quotation_data['company_name']}\n"
        f"Contact: {quotation_data['contact_name']} ({quotation_data['contact_email']})\n"
        f"Assigned To: {quotation_data['assigned_name']}\n"
        f"Status: {quotation_data['status']}\n"
        f"------------------------------------------------------------\n"
        f"Please log in to review.\n\n"
        f"Best regards,\nPrimeCRM System"
    )

    for email, name in recipients:
        try:
            # ❌ REMOVE 'name=' parameter
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"Quotation email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send quotation email to {email}: {e}")
            raise self.retry(exc=e)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_invoice_status_email_task(self, invoice_id, new_status):
    try:
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
        
        for email in recipients:
            # ❌ NO 'name=' parameter here either
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )
        logger.info(f"Invoice status email sent for Invoice #{invoice.id}")
    except Exception as e:
        logger.error(f"Failed to send invoice email: {e}")
        raise self.retry(exc=e)