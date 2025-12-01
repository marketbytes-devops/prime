#!/bin/bash

echo "Waiting for MySQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done

echo "Waiting for Redis..."
while ! nc -z $REDIS_HOST $REDIS_PORT; do
  sleep 1
done

echo "Applying migrations..."
python manage.py migrate

echo "Creating superuser if it doesn't exist..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    try:
        # Try with email parameter first
        User.objects.create_superuser(
            username='admin',
            email='admin@primearabiagroup.com',
            password='admin123'
        )
        print('✓ Superuser created: username=admin, password=admin123')
    except TypeError as e:
        # Fallback if email parameter not required
        try:
            User.objects.create_superuser('admin', 'admin123')
            print('✓ Superuser created (without email)')
        except Exception as e2:
            print(f'✗ Error creating superuser: {e2}')
else:
    print('✓ Superuser already exists')
"

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000