# Professional Archive & Backup System Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Directory Structure Setup](#directory-structure-setup)
3. [Implementation Steps](#implementation-steps)
4. [Automation Scripts](#automation-scripts)
5. [Backup Strategy](#backup-strategy)
6. [Maintenance & Best Practices](#maintenance--best-practices)

---

## Overview

This guide establishes a professional archive and backup system following industry best practices:
- **3-2-1 Backup Rule**: 3 copies, 2 different media types, 1 off-site
- **Git-first approach**: Version control as primary history
- **Automated workflows**: Reduce manual intervention
- **Clear documentation**: Every archive tells its story

### Key Principles
- Archives are for **reference and context**, not daily work
- Backups are for **disaster recovery**
- Version control (Git) is your **primary time machine**
- Automation prevents human error

---

## Directory Structure Setup

### Step 1: Create Base Directory Structure

```bash
# Navigate to your project root
cd /path/to/your/project

# Create archive structure
mkdir -p archive/{2024,2025}/{Q1,Q2,Q3,Q4}
mkdir -p archive/deprecated
mkdir -p archive/templates

# Create backup structure
mkdir -p backups/{daily,weekly,monthly}
mkdir -p backups/off-site

# Create config directory
mkdir -p .archive-system
```

### Step 2: Recommended Structure

```
project-root/
├── src/                          # Active development files
├── docs/                         # Current documentation
├── tests/                        # Active tests
│
├── archive/                      # ARCHIVED CONTENT
│   ├── 2024/
│   │   ├── Q1/
│   │   │   ├── 2024-01-15_legacy-api/
│   │   │   │   ├── files/       # Actual archived files
│   │   │   │   ├── README.md    # Context & metadata
│   │   │   │   └── metadata.json
│   │   │   └── 2024-03-20_old-docs/
│   │   ├── Q2/
│   │   └── ...
│   ├── 2025/
│   ├── deprecated/              # End-of-life features
│   └── templates/               # Archive templates
│
├── backups/                      # BACKUP SNAPSHOTS
│   ├── daily/
│   │   ├── 2025-09-29_daily.tar.gz
│   │   └── 2025-09-30_daily.tar.gz
│   ├── weekly/
│   │   └── 2025-W39_weekly.tar.gz
│   ├── monthly/
│   │   └── 2025-09_monthly.tar.gz
│   └── off-site/                # Sync to cloud
│
└── .archive-system/              # CONFIGURATION
    ├── config.json
    ├── archive-log.json
    └── scripts/
```

---

## Implementation Steps

### Step 3: Create Configuration File

Create `.archive-system/config.json`:

```json
{
  "version": "1.0.0",
  "archiveRoot": "./archive",
  "backupRoot": "./backups",
  "retention": {
    "daily": 7,
    "weekly": 4,
    "monthly": 12
  },
  "excludePatterns": [
    "node_modules",
    ".git",
    "*.log",
    "dist",
    "build",
    ".env*"
  ],
  "compression": {
    "enabled": true,
    "format": "tar.gz",
    "level": 6
  },
  "notifications": {
    "email": "dev-team@example.com",
    "slack": false
  }
}
```

### Step 4: Create Archive Template

Create `archive/templates/README-template.md`:

```markdown
# Archive: [Feature/Component Name]

## Archive Information
- **Archived Date:** YYYY-MM-DD
- **Archived By:** [Your Name/Team]
- **Original Location:** `path/to/original/files`
- **Last Modified:** YYYY-MM-DD

## Reason for Archiving
[Explain why this was archived - replaced, deprecated, end-of-life, etc.]

## Context
### What This Was
[Brief description of what this code/documentation did]

### Why It Existed
[Business context, original problem it solved]

### Dependencies
- Language/Runtime: [e.g., Node.js 14.x]
- Key Libraries: [e.g., Express 4.17, React 17]
- External Services: [e.g., Legacy payment API]

## Technical Details
### Architecture
[Brief overview of how it worked]

### Known Issues
- [Any unresolved bugs or limitations]

### Migration Notes
- **Replaced By:** [Link or path to replacement]
- **Migration Date:** YYYY-MM-DD
- **Migration Guide:** [Link to migration docs if applicable]

## Recovery Instructions
### How to Access This Code
1. Check Git history: `git log --all -- path/to/file`
2. Relevant Git tags: `archive-feature-name-v1.0`
3. Last working commit: `abc123def`

### How to Run (if needed)
```bash
# Commands to set up and run this archived code
npm install
npm start
```

## References
- **Related Issues:** #123, #456
- **Pull Requests:** #789
- **Documentation:** [Links to related docs]
- **Slack Discussions:** [Links if available]

## Files Included
```
files/
├── src/
├── docs/
├── tests/
└── config/
```

## Notes
[Any additional context, warnings, or useful information]
```

### Step 5: Create Archive Metadata Schema

Create `.archive-system/metadata-schema.json`:

```json
{
  "archiveId": "unique-identifier",
  "timestamp": "2025-09-30T10:30:00Z",
  "archivedBy": "developer-name",
  "source": {
    "path": "original/path/to/files",
    "gitCommit": "abc123def456",
    "gitBranch": "main",
    "gitTags": ["v1.2.0", "archive-legacy-api"]
  },
  "metadata": {
    "name": "Legacy API System",
    "type": "code|documentation|feature|component",
    "reason": "deprecated|replaced|obsolete|end-of-life",
    "category": "backend|frontend|docs|infrastructure"
  },
  "files": {
    "count": 42,
    "totalSize": "2.5MB",
    "types": [".js", ".md", ".json"]
  },
  "dependencies": {
    "runtime": "Node.js 14.x",
    "packages": ["express@4.17", "mongoose@5.12"]
  },
  "replacement": {
    "exists": true,
    "path": "src/api/v2",
    "migrationDate": "2024-03-15"
  },
  "retrieval": {
    "gitCommit": "abc123def",
    "gitTag": "archive-v1.0",
    "difficulty": "easy|medium|complex"
  }
}
```

---

## Automation Scripts

### Step 6: Archive Script (Node.js)

Create `.archive-system/scripts/archive.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ArchiveManager {
  constructor() {
    this.config = require('../config.json');
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.archiveRoot = path.join(this.projectRoot, this.config.archiveRoot);
  }

  async getGitInfo(sourcePath) {
    try {
      const { stdout: commit } = await execPromise(`git log -1 --format=%H -- ${sourcePath}`);
      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD');
      const { stdout: tags } = await execPromise(`git tag --points-at HEAD`);
      
      return {
        commit: commit.trim(),
        branch: branch.trim(),
        tags: tags.trim().split('\n').filter(t => t)
      };
    } catch (error) {
      return { commit: 'unknown', branch: 'unknown', tags: [] };
    }
  }

  async archive(sourcePath, options = {}) {
    const {
      reason = 'archived',
      category = 'general',
      name = path.basename(sourcePath)
    } = options;

    // Validate source exists
    if (!await fs.pathExists(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // Generate archive path
    const now = new Date();
    const year = now.getFullYear();
    const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const timestamp = now.toISOString().split('T')[0];
    const folderName = `${timestamp}_${name.replace(/[^a-z0-9-]/gi, '-')}`;
    
    const archivePath = path.join(
      this.archiveRoot,
      year.toString(),
      quarter,
      folderName
    );

    // Create archive directory
    await fs.ensureDir(archivePath);
    console.log(`📁 Creating archive at: ${archivePath}`);

    // Copy files
    const filesPath = path.join(archivePath, 'files');
    await fs.copy(sourcePath, filesPath);
    console.log(`✓ Copied files from: ${sourcePath}`);

    // Get Git information
    const gitInfo = await this.getGitInfo(sourcePath);

    // Create metadata
    const metadata = {
      archiveId: `${timestamp}-${Date.now()}`,
      timestamp: now.toISOString(),
      archivedBy: process.env.USER || 'unknown',
      source: {
        path: path.relative(this.projectRoot, sourcePath),
        gitCommit: gitInfo.commit,
        gitBranch: gitInfo.branch,
        gitTags: gitInfo.tags
      },
      metadata: {
        name,
        type: options.type || 'code',
        reason,
        category
      }
    };

    await fs.writeJSON(
      path.join(archivePath, 'metadata.json'),
      metadata,
      { spaces: 2 }
    );
    console.log(`✓ Created metadata.json`);

    // Copy README template and customize
    const templatePath = path.join(this.archiveRoot, 'templates', 'README-template.md');
    const readmePath = path.join(archivePath, 'README.md');
    
    if (await fs.pathExists(templatePath)) {
      let readme = await fs.readFile(templatePath, 'utf8');
      readme = readme
        .replace('[Feature/Component Name]', name)
        .replace('YYYY-MM-DD', timestamp)
        .replace('[Your Name/Team]', process.env.USER || 'Unknown')
        .replace('path/to/original/files', metadata.source.path)
        .replace('abc123def', gitInfo.commit.substring(0, 7));
      
      await fs.writeFile(readmePath, readme);
      console.log(`✓ Created README.md (please edit with specific details)`);
    }

    // Log archive action
    await this.logArchive(metadata);

    console.log(`\n✅ Archive created successfully!`);
    console.log(`📍 Location: ${path.relative(this.projectRoot, archivePath)}`);
    console.log(`📝 Next step: Edit ${path.join(folderName, 'README.md')} with specific details\n`);

    return archivePath;
  }

  async logArchive(metadata) {
    const logPath = path.join(this.projectRoot, '.archive-system', 'archive-log.json');
    let logs = [];
    
    if (await fs.pathExists(logPath)) {
      logs = await fs.readJSON(logPath);
    }
    
    logs.push(metadata);
    await fs.writeJSON(logPath, logs, { spaces: 2 });
  }

  async search(query) {
    const logPath = path.join(this.projectRoot, '.archive-system', 'archive-log.json');
    
    if (!await fs.pathExists(logPath)) {
      console.log('No archives found.');
      return [];
    }

    const logs = await fs.readJSON(logPath);
    const results = logs.filter(log => 
      log.metadata.name.toLowerCase().includes(query.toLowerCase()) ||
      log.metadata.reason.toLowerCase().includes(query.toLowerCase()) ||
      log.source.path.toLowerCase().includes(query.toLowerCase())
    );

    return results;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new ArchiveManager();

  if (args[0] === 'search') {
    manager.search(args[1] || '').then(results => {
      console.log(`\nFound ${results.length} archive(s):\n`);
      results.forEach(r => {
        console.log(`📦 ${r.metadata.name}`);
        console.log(`   Path: ${r.source.path}`);
        console.log(`   Date: ${r.timestamp.split('T')[0]}`);
        console.log(`   Reason: ${r.metadata.reason}\n`);
      });
    });
  } else {
    const sourcePath = args[0];
    const options = {
      reason: args[1] || 'archived',
      name: args[2] || path.basename(sourcePath),
      category: args[3] || 'general'
    };

    if (!sourcePath) {
      console.log(`
Usage: 
  node archive.js <source-path> [reason] [name] [category]
  node archive.js search <query>

Examples:
  node archive.js ./old-api "replaced by v2" "Legacy API" "backend"
  node archive.js search "legacy"
      `);
      process.exit(1);
    }

    manager.archive(sourcePath, options).catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
  }
}

module.exports = ArchiveManager;
```

### Step 7: Backup Script (Bash)

Create `.archive-system/scripts/backup.sh`:

```bash
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
```

Make the script executable:
```bash
chmod +x .archive-system/scripts/backup.sh
```

---

## Backup Strategy

### Step 8: Set Up Automated Backups

#### Option A: Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && ./.archive-system/scripts/backup.sh daily

# Weekly backup every Sunday at 3 AM
0 3 * * 0 cd /path/to/project && ./.archive-system/scripts/backup.sh weekly

# Monthly backup on 1st of month at 4 AM
0 4 1 * * cd /path/to/project && ./.archive-system/scripts/backup.sh monthly
```

#### Option B: Using GitHub Actions

Create `.github/workflows/backup.yml`:

```yaml
name: Automated Backups

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
    - cron: '0 3 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Create backup
        run: |
          ./.archive-system/scripts/backup.sh daily
      
      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --follow-symlinks
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'backups/'
```

### Step 9: Cloud Backup Setup

#### Using rclone (recommended for any cloud provider)

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure cloud storage
rclone config

# Create sync script
cat > .archive-system/scripts/cloud-sync.sh << 'EOF'
#!/bin/bash
# Sync backups to cloud storage

BACKUP_DIR="./backups"
REMOTE_NAME="mycloud"  # Name from rclone config
REMOTE_PATH="project-backups"

echo "Syncing backups to cloud..."
rclone sync "$BACKUP_DIR" "${REMOTE_NAME}:${REMOTE_PATH}" \
    --progress \
    --checksum \
    --exclude "*.tmp"

echo "✓ Cloud sync completed"
EOF

chmod +x .archive-system/scripts/cloud-sync.sh
```

---

## Maintenance & Best Practices

### Step 10: Create Maintenance Checklist

Create `ARCHIVE-MAINTENANCE.md`:

```markdown
# Archive & Backup Maintenance Checklist

## Weekly Tasks
- [ ] Verify daily backups are running
- [ ] Check backup storage usage
- [ ] Review archive log for recent additions

## Monthly Tasks
- [ ] Test restore procedure from weekly backup
- [ ] Review and compress quarterly archives
- [ ] Verify cloud sync is functioning
- [ ] Update archive README files if needed
- [ ] Check for archives that can be permanently deleted

## Quarterly Tasks
- [ ] Compress completed quarter archives
- [ ] Move old backups to cold storage
- [ ] Review retention policies
- [ ] Audit archive access logs
- [ ] Update documentation

## Annual Tasks
- [ ] Full system backup verification
- [ ] Review and update archive structure
- [ ] Compress previous year's archives
- [ ] Update backup scripts and tools
- [ ] Security audit of backup locations
```

### Step 11: Git Integration

Update `.gitignore`:

```gitignore
# Backups - don't commit to Git
/backups/
*.tar.gz
*.zip

# Archive - commit metadata only
/archive/**/files/
!/archive/**/README.md
!/archive/**/metadata.json

# System files
.DS_Store
.archive-system/archive-log.json
```

Create `.gitattributes`:

```
# Archive metadata should be readable
archive/**/README.md text
archive/**/metadata.json text

# Mark large files
*.tar.gz filter=lfs diff=lfs merge=lfs -text
```

### Step 12: Documentation

Create `ARCHIVE-GUIDE.md` in project root:

```markdown
# Archive & Backup Guide

## Quick Start

### Archive old files
```bash
node .archive-system/scripts/archive.js ./path/to/old-code "reason" "name"
```

### Search archives
```bash
node .archive-system/scripts/archive.js search "keyword"
```

### Create backup
```bash
./.archive-system/scripts/backup.sh daily
```

### Restore from backup
```bash
tar -xzf backups/daily/2025-09-30_daily.tar.gz -C ./restore-location
```

## Archive Structure
- Archives are organized by year and quarter
- Each archive includes metadata.json and README.md
- Use search to find archived content

## Backup Schedule
- **Daily**: Automatic at 2 AM
- **Weekly**: Every Sunday at 3 AM  
- **Monthly**: 1st of month at 4 AM

## Emergency Recovery
See DISASTER-RECOVERY.md for full procedures.
```

---

## Quick Reference Commands

### Archive Operations
```bash
# Archive files
node .archive-system/scripts/archive.js ./old-feature "deprecated" "Legacy Auth"

# Search archives
node .archive-system/scripts/archive.js search "api"

# List all archives
find archive -name "README.md" -exec head -3 {} \;
```

### Backup Operations
```bash
# Manual backup
./.archive-system/scripts/backup.sh daily

# Verify backup
tar -tzf backups/daily/2025-09-30_daily.tar.gz | head

# Restore specific files
tar -xzf backups/daily/2025-09-30_daily.tar.gz src/specific-file.js
```

### Maintenance
```bash
# Check backup sizes
du -sh backups/*

# Count archives
find archive -type d -name "20*" | wc -l

# Find large archived files
find archive -type f -size +10M
```

---

## Troubleshooting

### Issue: Backup script fails
**Solution**: Check disk space and permissions
```bash
df -h
ls -la backups/
```

### Issue: Cannot find archived files
**Solution**: Use search or check archive log
```bash
node .archive-system/scripts/archive.js search "keyword"
cat .archive-system/archive-log.json | jq
```

### Issue: Git history lost for archived files
**Solution**: Git history is preserved, use:
```bash
git log --all --full-history -- path/to/file
```

---

## Security Considerations

1. **Encrypt sensitive backups**: Use GPG encryption for backups containing secrets
2. **Restrict access**: Set proper permissions on backup directories (700)
3. **Verify checksums**: Always verify backup integrity before deletion
4. **Off-site storage**: Keep at least one backup copy off-site
5. **Access logging**: Monitor who accesses archived materials

---

## Support & Updates

- Update this system as your needs evolve
- Document any custom modifications
- Share improvements with your team
- Review annually for best practices

**Last Updated**: 2025-09-30  
**Version**: 1.0.0