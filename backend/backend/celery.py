# backend/celery.py
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Using namespace='CELERY' means all celery-related config keys should have a `CELERY_` prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps
app.autodiscover_tasks()

# Optional: Load additional configuration
try:
    from .celery_config import *
    app.conf.update(
        task_routes=task_routes,
        worker_prefetch_multiplier=worker_prefetch_multiplier,
        worker_max_tasks_per_child=worker_max_tasks_per_child,
        beat_schedule=beat_schedule,
    )
except ImportError:
    pass

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')