#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.gz"

mkdir -p "${BACKUP_DIR}"

echo "==> Creating MongoDB backup from docker container 'language-buddy-db-1'..."

docker compose exec -T db mongodump --db language_buddy --archive --gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

echo "==> Backup created successfully: ${BACKUP_DIR}/${BACKUP_FILE} ($(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1))"
