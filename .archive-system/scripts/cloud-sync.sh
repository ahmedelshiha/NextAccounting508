#!/bin/bash
# Sync backups to cloud storage using rclone

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
REMOTE_NAME="mycloud"  # Update with your rclone remote name
REMOTE_PATH="project-backups"

if [ -z "$REMOTE_NAME" ]; then
  echo "Please set REMOTE_NAME in this script to your rclone remote name."
  exit 1
fi

echo "Syncing backups to ${REMOTE_NAME}:${REMOTE_PATH}..."

rclone sync "$BACKUP_DIR" "${REMOTE_NAME}:${REMOTE_PATH}" \
  --progress \
  --checksum \
  --exclude "*.tmp"

echo "✓ Cloud sync completed"
