# Services Management System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Enhanced Services Management System in production environments. It covers various deployment options, configuration requirements, and best practices for scalable, secure deployments.

## Pre-Deployment Checklist

### System Requirements
- **Node.js**: 18.0 or higher
- **Database**: PostgreSQL 14+ (recommended) or compatible
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: 10GB+ for application and file uploads
- **SSL Certificate**: Required for production

### Dependencies Verification
```bash
# Verify Node.js version
node --version  # Should be 18.0+

# Check npm/yarn installation
npm --version
yarn --version

# Verify database connectivity
psql --version  # PostgreSQL client
```

### Environment Setup
Create production environment configuration:

```bash
# Create production environment file
touch .env.production

# Set appropriate file permissions
chmod 600 .env.production
```

## Environment Configuration

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/database_name"
DATABASE_SSL=true
DATABASE_POOL_SIZE=10

# Application Settings
NODE_ENV=production
PORT=3000
DOMAIN="https://your-domain.com"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-secret-key-here"
JWT_SECRET="your-jwt-secret-key-here"

# File Storage
UPLOAD_MAX_SIZE=2097152  # 2MB in bytes
ALLOWED_FILE_TYPES="image/png,image/jpeg,image/webp"
STORAGE_PROVIDER="aws-s3"  # or "local", "cloudinary"

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="your-bucket-name"

# Cloudinary Configuration (alternative)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email Configuration
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"

# External APIs
EXCHANGE_RATE_API_KEY="your-exchange-rate-api-key"
EXCHANGE_RATE_PROVIDER="exchangerate-api"  # or "fixer", "currencylayer"

# Monitoring & Logging
LOG_LEVEL="info"  # "debug", "info", "warn", "error"
SENTRY_DSN="your-sentry-dsn"  # Optional error tracking
NEW_RELIC_LICENSE_KEY="your-newrelic-key"  # Optional APM

# Security
CORS_ORIGIN="https://your-domain.com"
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
RATE_LIMIT_MAX=100
SESSION_TIMEOUT=3600000  # 1 hour in ms

# Feature Flags
ENABLE_FILE_UPLOAD=true
ENABLE_CURRENCY_CONVERSION=true
ENABLE_BULK_OPERATIONS=true
ENABLE_ADVANCED_ANALYTICS=true
```

## Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

2. **Create Database and User**:
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE accounting_services;

-- Create user with permissions
CREATE USER services_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE accounting_services TO services_user;

-- Enable required extensions
\c accounting_services
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
```

3. **Configure PostgreSQL** (`postgresql.conf`):
```bash
# Performance settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
listen_addresses = 'localhost'

# Logging
log_statement = 'mod'  # Log modifications
log_duration = on
```

### Database Schema Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

### Database Backup Strategy

Create automated backup script:
```bash
#!/bin/bash
# backup-db.sh

DB_NAME="accounting_services"
DB_USER="services_user"
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER -h localhost -F c $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Set up cron job
# 0 2 * * * /path/to/backup-db.sh
```

## Application Deployment

### Option 1: Traditional Server Deployment

#### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG sudo appuser
```

#### 2. Application Setup
```bash
# Clone repository
git clone <your-repository-url> /var/www/accounting-services
cd /var/www/accounting-services

# Set ownership
sudo chown -R appuser:appuser /var/www/accounting-services

# Switch to app user
sudo -u appuser bash

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up environment
cp .env.example .env.production
# Edit .env.production with your values
```

#### 3. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'accounting-services',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/accounting-services',
    instances: 2,  // Cluster mode
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/accounting-services/error.log',
    out_file: '/var/log/accounting-services/out.log',
    log_file: '/var/log/accounting-services/combined.log',
    time: true,
    // Auto-restart settings
    max_restarts: 3,
    min_uptime: '10s',
    max_memory_restart: '300M',
    // Health monitoring
    health_check_grace_period: 10000,
    health_check_fatal_exceptions: true
  }]
}
```

#### 4. Start Application
```bash
# Create log directory
sudo mkdir -p /var/log/accounting-services
sudo chown appuser:appuser /var/log/accounting-services

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
sudo pm2 startup systemd -u appuser --hp /home/appuser
```

### Option 2: Docker Deployment

#### 1. Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### 2. Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: accounting_services
      POSTGRES_USER: services_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U services_user -d accounting_services"]
      interval: 30s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Option 3: Vercel Deployment

#### 1. Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/currency-rates", 
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### 2. Deployment Steps
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all other environment variables
```

## Web Server Configuration

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/accounting-services
upstream app_server {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;  # If running multiple instances
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=uploads:10m rate=2r/s;

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # File upload size
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload endpoints
    location /api/admin/services/*/image {
        limit_req zone=uploads burst=5 nodelay;
        proxy_pass http://app_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }

    # Static file serving (if not using CDN)
    location /uploads/ {
        alias /var/www/accounting-services/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/accounting-services.access.log;
    error_log /var/log/nginx/accounting-services.error.log;
}
```

## SSL Certificate Setup

### Option 1: Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Custom SSL Certificate
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/{certs,private}

# Copy your certificate files
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-domain.key
```

## Monitoring & Logging

### Application Monitoring

#### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Application logs
pm2 logs accounting-services

# Application status
pm2 status

# Restart application
pm2 restart accounting-services
```

#### System Monitoring Script
```bash
#!/bin/bash
# monitor.sh - Basic system monitoring

LOG_FILE="/var/log/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3/$2*100}')
if [ $MEM_USAGE -gt 85 ]; then
    echo "$DATE - WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

# Check application status
if ! pm2 show accounting-services > /dev/null 2>&1; then
    echo "$DATE - ERROR: Application is not running" >> $LOG_FILE
    pm2 restart accounting-services
fi

# Check database connectivity
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "$DATE - ERROR: Database is not responding" >> $LOG_FILE
fi
```

### Log Management

#### Logrotate Configuration
```bash
# /etc/logrotate.d/accounting-services
/var/log/accounting-services/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 appuser appuser
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/accounting-services.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

## Security Hardening

### Firewall Configuration
```bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow database (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

### Application Security

#### Security Headers Middleware
```javascript
// middleware/security.js
const helmet = require('helmet')

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

#### Rate Limiting
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    }
  }
})

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit file uploads
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMITED',
      message: 'Too many file uploads, please try again later.'
    }
  }
})

module.exports = { apiLimiter, uploadLimiter }
```

## Performance Optimization

### Caching Strategy

#### Redis Setup
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis (/etc/redis/redis.conf)
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Application Caching
```javascript
// lib/cache.js
const Redis = require('redis')
const client = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
})

const cache = {
  get: async (key) => {
    try {
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },
  
  set: async (key, value, ttl = 300) => {
    try {
      await client.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },
  
  delete: async (key) => {
    try {
      await client.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }
}

module.exports = cache
```

### Database Optimization

#### PostgreSQL Tuning
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_services_active ON services(active) WHERE active = true;
CREATE INDEX CONCURRENTLY idx_services_featured ON services(featured) WHERE featured = true;
CREATE INDEX CONCURRENTLY idx_services_category ON services(category);
CREATE INDEX CONCURRENTLY idx_services_currency ON services(currency);
CREATE INDEX CONCURRENTLY idx_services_price ON services(price) WHERE price IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_services_search ON services USING gin(to_tsvector('english', name || ' ' || description));

-- Add composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_services_active_category ON services(active, category);
CREATE INDEX CONCURRENTLY idx_services_active_featured ON services(active, featured);
```

#### Connection Pooling
```javascript
// lib/db.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Health check
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

module.exports = pool
```

## Backup and Recovery

### Automated Backup System

#### Full Backup Script
```bash
#!/bin/bash
# full-backup.sh - Complete system backup

# Configuration
BACKUP_DIR="/var/backups/accounting-services"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

echo "Starting full backup at $(date)"

# Database backup
echo "Backing up database..."
pg_dump -U $DB_USER -h localhost -F c $DB_NAME > $BACKUP_DIR/$DATE/database.sql
if [ $? -eq 0 ]; then
    echo "Database backup completed successfully"
else
    echo "Database backup failed!"
    exit 1
fi

# Application files backup
echo "Backing up application files..."
tar -czf $BACKUP_DIR/$DATE/application.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=uploads \
    /var/www/accounting-services/

# Upload files backup (if using local storage)
if [ -d "/var/www/accounting-services/uploads" ]; then
    echo "Backing up upload files..."
    tar -czf $BACKUP_DIR/$DATE/uploads.tar.gz /var/www/accounting-services/uploads/
fi

# Configuration backup
echo "Backing up configuration..."
cp /var/www/accounting-services/.env.production $BACKUP_DIR/$DATE/
cp /etc/nginx/sites-available/accounting-services $BACKUP_DIR/$DATE/nginx.conf
cp /var/www/accounting-services/ecosystem.config.js $BACKUP_DIR/$DATE/

# Create backup manifest
cat > $BACKUP_DIR/$DATE/manifest.txt << EOF
Backup created: $(date)
Database size: $(du -h $BACKUP_DIR/$DATE/database.sql | cut -f1)
Application size: $(du -h $BACKUP_DIR/$DATE/application.tar.gz | cut -f1)
Total backup size: $(du -sh $BACKUP_DIR/$DATE | cut -f1)
EOF

# Cleanup old backups
find $BACKUP_DIR -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# Compress backup directory
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

echo "Full backup completed: backup_$DATE.tar.gz"
```

#### Recovery Script
```bash
#!/bin/bash
# restore.sh - System recovery script

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

echo "Starting recovery from $BACKUP_FILE"

# Extract backup
mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR

BACKUP_DATE=$(basename $BACKUP_FILE .tar.gz | sed 's/backup_//')
EXTRACT_DIR="$RESTORE_DIR/$BACKUP_DATE"

# Restore database
echo "Restoring database..."
read -p "This will overwrite the current database. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pg_restore -U $DB_USER -h localhost -d $DB_NAME --clean --if-exists $EXTRACT_DIR/database.sql
    echo "Database restored successfully"
fi

# Restore application files
echo "Restoring application files..."
read -p "This will overwrite application files. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd /var/www
    tar -xzf $EXTRACT_DIR/application.tar.gz
    chown -R appuser:appuser accounting-services/
    echo "Application files restored successfully"
fi

# Restore uploads
if [ -f "$EXTRACT_DIR/uploads.tar.gz" ]; then
    echo "Restoring upload files..."
    cd /var/www/accounting-services
    tar -xzf $EXTRACT_DIR/uploads.tar.gz
    chown -R appuser:appuser uploads/
fi

# Restore configuration
echo "Restoring configuration files..."
cp $EXTRACT_DIR/.env.production /var/www/accounting-services/
cp $EXTRACT_DIR/nginx.conf /etc/nginx/sites-available/accounting-services
cp $EXTRACT_DIR/ecosystem.config.js /var/www/accounting-services/

# Restart services
echo "Restarting services..."
sudo systemctl reload nginx
pm2 restart accounting-services

# Cleanup
rm -rf $RESTORE_DIR

echo "Recovery completed successfully"
```

## Disaster Recovery Plan

### High Availability Setup

#### Load Balancer Configuration (HAProxy)
```bash
# /etc/haproxy/haproxy.cfg
global
    daemon
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

frontend accounting_services
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/accounting-services.pem
    redirect scheme https if !{ ssl_fc }
    default_backend app_servers

backend app_servers
    balance roundrobin
    option httpchk GET /api/health
    server app1 10.0.1.10:3000 check
    server app2 10.0.1.11:3000 check
    server app3 10.0.1.12:3000 check
```

#### Database Clustering (PostgreSQL)
```bash
# Master-Slave replication setup
# Master server configuration (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 32
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'

# Create replication user
CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 3 ENCRYPTED PASSWORD 'rep_password';

# Slave server setup
pg_basebackup -h master_ip -D /var/lib/postgresql/12/main -U replicator -P -v -R -X stream -C -S slave1
```

## Monitoring and Alerting

### Application Performance Monitoring

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'accounting-services'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
```

#### Custom Metrics Endpoint
```javascript
// api/metrics.js
const promClient = require('prom-client')

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

const servicesCount = new promClient.Gauge({
  name: 'services_total',
  help: 'Total number of services',
  labelNames: ['status']
})

const activeUsersCount = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
})

// Export metrics
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Update custom metrics
    const services = await getServicesStats()
    servicesCount.set({ status: 'active' }, services.active)
    servicesCount.set({ status: 'inactive' }, services.inactive)

    // Return metrics
    res.set('Content-Type', promClient.register.contentType)
    res.end(await promClient.register.metrics())
  } catch (error) {
    console.error('Metrics error:', error)
    res.status(500).json({ error: 'Failed to generate metrics' })
  }
}
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "id": null,
    "title": "Accounting Services Dashboard",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "id": 3,
        "title": "Services Count",
        "type": "singlestat",
        "targets": [
          {
            "expr": "services_total{status=\"active\"}",
            "legendFormat": "Active Services"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Application Won't Start
```bash
# Check logs
pm2 logs accounting-services

# Check port availability
sudo netstat -tlnp | grep :3000

# Check environment variables
pm2 env accounting-services

# Check file permissions
ls -la /var/www/accounting-services

# Restart application
pm2 restart accounting-services
```

#### Database Connection Issues
```bash
# Test database connectivity
pg_isready -h localhost -p 5432

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log

# Test connection with credentials
psql -h localhost -U services_user -d accounting_services

# Check connection limits
SELECT * FROM pg_stat_activity;
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Restart application to clear memory
pm2 restart accounting-services

# Check for memory leaks in logs
pm2 logs accounting-services | grep -i memory
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in /etc/ssl/certs/your-domain.crt -noout -dates

# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### Performance Issues

#### Slow API Responses
```bash
# Check database query performance
# Enable slow query logging in PostgreSQL
log_min_duration_statement = 1000  # Log queries taking >1s

# Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'services';
```

#### High CPU Usage
```bash
# Check top processes
top -p $(pgrep node)

# Check Node.js heap usage
node --inspect-brk=0.0.0.0:9229 app.js

# Profile application
pm2 install pm2-profiler
pm2 profile:cpu 60s
```

## Security Audit Checklist

### Pre-Production Security Review

- [ ] **Environment Variables**: All secrets properly configured
- [ ] **SSL/TLS**: Certificate valid and properly configured
- [ ] **Firewall**: Only necessary ports open
- [ ] **Database**: User permissions restricted, SSL enabled
- [ ] **File Uploads**: Size limits, type validation, virus scanning
- [ ] **Rate Limiting**: API and upload endpoints protected
- [ ] **Authentication**: Strong password policies, session security
- [ ] **CORS**: Properly configured for domain
- [ ] **Security Headers**: All headers implemented
- [ ] **Logging**: Security events logged and monitored
- [ ] **Backups**: Automated backups working and tested
- [ ] **Updates**: All dependencies up to date

### Security Monitoring
```bash
# Set up fail2ban for SSH protection
sudo apt install fail2ban

# Configure fail2ban (/etc/fail2ban/jail.local)
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "Starting weekly maintenance..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up log files
sudo logrotate -f /etc/logrotate.d/accounting-services

# Restart application to clear memory
pm2 restart accounting-services

# Check disk space
df -h

# Database maintenance
psql -d accounting_services -c "VACUUM ANALYZE;"

# Check for broken links or issues
curl -f http://localhost:3000/api/health || echo "Health check failed"

echo "Weekly maintenance completed"
```

#### Monthly Tasks
```bash
#!/bin/bash
# monthly-maintenance.sh

echo "Starting monthly maintenance..."

# Full database backup
./backup-db.sh

# Security updates
sudo apt update && sudo apt list --upgradable | grep -i security

# Certificate renewal check
sudo certbot certificates

# Performance analysis
echo "Top 10 slowest queries:"
psql -d accounting_services -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# Disk cleanup
sudo apt autoremove -y
sudo apt autoclean

echo "Monthly maintenance completed"
```

This comprehensive deployment guide covers all aspects of deploying the Enhanced Services Management System in production environments, from basic server setup to advanced monitoring and disaster recovery procedures.

---

**Deployment Version**: 1.0  
**Last Updated**: January 2024  
**Maintained by**: DevOps Team
  