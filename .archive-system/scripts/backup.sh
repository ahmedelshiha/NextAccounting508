#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/.archive-system/config.json"
BACKUP_ROOT="${PROJECT_ROOT}/backups"

log() {
  printf '\033[0;32m[%s]\033[0m %s\n' "$(date +'%Y-%m-%d %H:%M:%S')" "$1"
}

warn() {
  printf '\033[1;33m[WARN]\033[0m %s\n' "$1"
}

error() {
  printf '\033[0;31m[ERROR]\033[0m %s\n' "$1" >&2
}

ensure_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    error "Archive configuration not found at $CONFIG_FILE"
    exit 1
  fi
}

read_retention_value() {
  local key=$1
  node -e "const cfg = require(process.argv[1]); const fallback = { daily: 7, weekly: 4, monthly: 12 }; console.log(cfg?.retention?.[process.argv[2]] ?? fallback[process.argv[2]]);" "$CONFIG_FILE" "$key"
}

cleanup_temp_file() {
  local file_path=$1
  [[ -f "$file_path" ]] && rm -f "$file_path"
}

create_backup() {
  local backup_type=$1
  local subdir="$BACKUP_ROOT/${backup_type}"
  mkdir -p "$subdir"

  local timestamp
  case "$backup_type" in
    weekly)
      timestamp="$(date +'%Y-W%V')_weekly"
      ;;
    monthly)
      timestamp="$(date +'%Y-%m')_monthly"
      ;;
    *)
      timestamp="$(date +'%Y-%m-%d')_daily"
      ;;
  esac

  local backup_file="$subdir/${timestamp}.tar.gz"
  if [[ -f "$backup_file" ]]; then
    warn "Backup already exists: ${backup_file}"
    return 0
  fi

  log "Creating ${backup_type} backup";

  local exclude_file
  exclude_file="$(mktemp)"
  cat <<'EOF' > "$exclude_file"
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

  local includes=()
  for candidate in archive docs src tests .archive-system package.json pnpm-lock.yaml; do
    if [[ -e "$PROJECT_ROOT/$candidate" ]]; then
      includes+=("$candidate")
    fi
  done

  if [[ ${#includes[@]} -eq 0 ]]; then
    cleanup_temp_file "$exclude_file"
    error "No files available to include in the backup."
    exit 1
  fi

  if tar -czf "$backup_file" \
    --exclude-from="$exclude_file" \
    -C "$PROJECT_ROOT" \
    "${includes[@]}" 2>/dev/null; then
    cleanup_temp_file "$exclude_file"
  else
    cleanup_temp_file "$exclude_file"
    error "Failed to create backup archive."
    exit 1
  fi

  local checksum_file="${backup_file}.sha256"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$backup_file" > "$checksum_file"
  else
    warn "sha256sum not available; skipping checksum creation."
  fi

  if [[ -f "$backup_file" ]]; then
    local size
    size=$(du -h "$backup_file" | cut -f1)
    log "Backup created at ${backup_file} (${size})"
    verify_backup "$backup_file"
  else
    error "Backup archive missing after creation attempt."
    exit 1
  fi
}

verify_backup() {
  local archive_path=$1
  local checksum_file="${archive_path}.sha256"

  if [[ -f "$checksum_file" ]]; then
    if sha256sum -c "$checksum_file" >/dev/null 2>&1; then
      log "Checksum verification succeeded"
    else
      error "Checksum verification failed for ${archive_path}"
      exit 1
    fi
  else
    warn "Checksum file missing for ${archive_path}; verification skipped"
  fi
}

cleanup_old_backups() {
  local backup_type=$1
  local retention=$2
  local target_dir="$BACKUP_ROOT/${backup_type}"

  [[ -d "$target_dir" ]] || return 0

  mapfile -t archives < <(ls -1t "$target_dir"/*.tar.gz 2>/dev/null)
  local keep=$retention

  if [[ ${#archives[@]} -le $keep ]]; then
    return 0
  fi

  for ((i=keep; i<${#archives[@]}; i++)); do
    local file="${archives[$i]}"
    rm -f "$file" "${file}.sha256"
    log "Removed old backup $(basename "$file")"
  done
}

main() {
  ensure_config

  local backup_type="${1:-daily}"
  local daily_retention weekly_retention monthly_retention
  daily_retention=$(read_retention_value daily)
  weekly_retention=$(read_retention_value weekly)
  monthly_retention=$(read_retention_value monthly)

  case "$backup_type" in
    daily)
      create_backup "daily"
      cleanup_old_backups "daily" "$daily_retention"
      ;;
    weekly)
      create_backup "weekly"
      cleanup_old_backups "weekly" "$weekly_retention"
      ;;
    monthly)
      create_backup "monthly"
      cleanup_old_backups "monthly" "$monthly_retention"
      ;;
    *)
      error "Unsupported backup type: ${backup_type}"
      echo "Usage: backup.sh [daily|weekly|monthly]"
      exit 1
      ;;
  esac

  log "${backup_type^} backup workflow completed"
}

main "$@"
