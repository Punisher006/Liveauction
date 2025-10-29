#!/bin/bash

# Database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="liveauction_production"

# Create backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Log backup
echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz" >> /var/log/backup.log