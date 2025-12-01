# pre_job/apps.py
from django.apps import AppConfig


class PreJobConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pre_job'

    def ready(self):
        # This is the magic line — safely imports tasks AFTER Django is ready
        import pre_job.tasks  # ← This registers your Celery task