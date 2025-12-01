# backend/celery_config.py
from datetime import timedelta

# Task routes
task_routes = {
    'pre_job.tasks.*': {'queue': 'emails'},
    'authapp.tasks.*': {'queue': 'auth'},
    'default': {'queue': 'default'},
}

# Task serialization
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000
worker_concurrency = 4

# Beat schedule (example)
beat_schedule = {
    'cleanup-old-tasks': {
        'task': 'backend.tasks.cleanup_old_tasks',
        'schedule': timedelta(days=1),
    },
}