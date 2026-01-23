#!/bin/bash
# MongoDB Backup Script
# Creates automated backups of MongoDB database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MONGO_URI="${MONGO_URI:-${MONGODB_URI:-mongodb://localhost:27017/selorg-admin-ops}}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${DATE}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup: $BACKUP_NAME"

# Perform backup
if [[ "$MONGO_URI" == mongodb+srv://* ]]; then
  # MongoDB Atlas - use mongodump with connection string
  mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$BACKUP_NAME"
else
  # Local MongoDB
  mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$BACKUP_NAME"
fi

# Compress backup
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

echo "Backup completed: ${BACKUP_NAME}.tar.gz"

# Cleanup old backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned (retention: $RETENTION_DAYS days)"
