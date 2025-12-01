#!/bin/bash

echo "Waiting for Django backend to be ready..."
# Wait for backend to complete migrations
sleep 20

echo "Starting Celery..."
# Execute the command passed from docker-compose
exec "$@"