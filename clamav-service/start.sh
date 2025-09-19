#!/bin/sh
set -e

echo "Starting ClamAV services..."

# Update virus definitions
echo "Updating virus definitions..."
freshclam --quiet || echo "Warning: Initial freshclam update failed"

# Start ClamAV daemon in background
echo "Starting ClamAV daemon..."
clamd &

# Wait for daemon to be ready
sleep 10

# Start background updater
echo "Starting signature updater..."
(
  while true; do
    sleep 3600  # Update every hour
    echo "Running scheduled virus definition update..."
    freshclam --quiet || echo "Scheduled update failed"
  done
) &

# Start Flask API
echo "Starting Flask API server..."
exec gunicorn --bind 0.0.0.0:8080 --workers 2 --timeout 120 app:app
