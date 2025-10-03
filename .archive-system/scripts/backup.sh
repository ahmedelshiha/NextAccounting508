#!/bin/bash

# Professional Backup Script
# Usage: ./backup.sh [daily|weekly|monthly]

set -e  # Exit on error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
CONFIG_FILE="${PROJECT_ROOT}/.archive-system/config.json"

# Load retention settings from config
DAILY_RETENTION=$(jq -r '.retention.daily' "$CONFIG_FILE")
WEEKLY_RETENTION=$(jq -r '.retention.weekly' "$CONFIG_FILE")
MONTHLY_RETENTION=$(jq -r '.retention.monthly' "$CONFIG_FILE")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Backup function
create_backup() {
    local backup_type=$1
    local backup_dir="${BACKUP_ROOT}/${backup_type}"
    
    mkdir -p "$backup_dir"
    
    # Generate backup filename
    local timestamp
    if [ "$backup_type" = "weekly" ]; then
        timestamp="$(date +'%Y-W%V')_weekly"
    elif [ "$backup_type" = "monthly" ]; then
        timestamp="$(date +'%Y-%m')_monthly"
    else
        timestamp="$(date +'%Y-%m-%d')_daily"
    fi
    
    local backup_file="${backup_dir}/${timestamp}.tar.gz"
    
    # Check if backup already exists
    if [ -f "$backup_file" ]; then
        warn "Backup already exists: $backup_file"
        return 0
    fi
    
    log "Creating ${backup_type} backup..."
    
    # Create temporary exclusion list
    local exclude_file=$(mktemp)
    cat > "$exclude_file" << EOF
--exclude=node_modules
--exclude=.git
--exclude=dist
--exclude=build
--exclude=*.log
--exclude=.env*
--exclude=backups
--exclude=*.tar.gz
--exclude=.DS_Store
EOF
    
    # Create backup
    tar -czf "$backup_file" \
        --exclude-from="$exclude_file" \
        -C "$PROJECT_ROOT" \
        src docs tests archive .archive-system 2>/dev/null || true
    
    rm "$exclude_file"
    
    # Verify backup was created
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log "✓ Backup created: ${backup_file} (${size})"
        
        # Create checksum
        sha256sum "$backup_file" > "${backup_file}.sha256"
        log "✓ Checksum created"
    else
        error "Failed to create backup"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_type=$1
    local retention=$2
    local backup_dir="${BACKUP_ROOT}/${backup_type}"
    
    if [ ! -d "$backup_dir" ]; then
        return 0
    fi
    
    log "Cleaning up old ${backup_type} backups (keeping last ${retention})..."
    
    # Keep only the most recent N backups
    local files_to_delete=$(ls -t "${backup_dir}"/*.tar.gz 2>/dev/null | tail -n +$((retention + 1)))
    
    if [ -n "$files_to_delete" ]; then
        echo "$files_to_delete" | while read -r file; do
            rm -f "$file" "${file}.sha256"
            log "✓ Removed old backup: $(basename "$file")"
        done
    else
        log "No old backups to remove"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Verifying backup integrity..."
    
    # Check if checksum file exists
    if [ -f "${backup_file}.sha256" ]; then
        if sha256sum -c "${backup_file}.sha256" > /dev/null 2>&1; then
            log "✓ Backup integrity verified"
            return 0
        else
            error "Backup integrity check failed!"
            return 1
        fi
    else
        warn "No checksum file found, skipping verification"
        return 0
    fi
}

# Main execution
main() {
    local backup_type=${1:-daily}
    
    log "Starting ${backup_type} backup process..."
    
    case $backup_type in
        daily)
            create_backup "daily"
            cleanup_old_backups "daily" "$DAILY_RETENTION"
            ;;
        weekly)
            create_backup "weekly"
            cleanup_old_backups "weekly" "$WEEKLY_RETENTION"
            ;;
        monthly)
            create_backup "monthly"
            cleanup_old_backups "monthly" "$MONTHLY_RETENTION"
            ;;
        *)
            error "Invalid backup type: $backup_type"
            echo "Usage: $0 [daily|weekly|monthly]"
            exit 1
            ;;
    esac
    
    log "Backup process completed successfully!"
}

# Run main function
main "$@"
