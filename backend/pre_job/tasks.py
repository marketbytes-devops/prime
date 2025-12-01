# pre_job/tasks.py
from celery import shared_task
from django.core.mail import send_mail
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