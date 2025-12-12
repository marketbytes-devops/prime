#!/bin/bash
set -e

echo "Waiting for MySQL..."
until nc -z $DB_HOST $DB_PORT; do
  sleep 1
done

echo "Waiting for Redis..."
until nc -z $REDIS_HOST $REDIS_PORT; do
  sleep 1
done

if [ "$SERVICE" = "backend" ]; then
    echo "Running migrations..."
    python manage.py migrate

    echo "Collecting staticfiles..."
    python manage.py collectstatic --noinput

    echo "Starting Gunicorn..."
    exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000
fi

if [ "$SERVICE" = "celery" ]; then
    echo "Starting Celery Worker..."
    exec celery -A backend.celery worker --loglevel=info --concurrency=4
fi

if [ "$SERVICE" = "beat" ]; then
    echo "Starting Celery Beat..."
    exec celery -A backend.celery beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
fi
