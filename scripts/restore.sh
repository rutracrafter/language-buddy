#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "==> Restoring MongoDB database 'language_buddy' from '${BACKUP_FILE}'..."
echo "Warning: This will overwrite existing records in language_buddy."

docker compose exec -T db mongorestore --nsInclude "language_buddy.*" --archive --gzip --drop < "${BACKUP_FILE}"

echo "==> Restore completed successfully!"
