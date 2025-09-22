
This guide provides step-by-step instructions for deploying the Accounting Firm application to various hosting platforms.

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel is the recommended hosting platform for this Next.js application due to its seamless integration and automatic optimizations.

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase account for database hosting

### Step 1: Prepare Your Repository

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Set Up Database (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "accounting-firm"
   - Generate a secure password
   - Select a region close to your users

2. **Get Database URL**
   - Go to Settings > Database
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the accounting-firm repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

3. **Add Environment Variables**
   
   In the Vercel deployment configuration, add these environment variables:
   
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   NEXTAUTH_URL=https://your-project-name.vercel.app
   NEXTAUTH_SECRET=your-production-secret-key-here
   SENDGRID_API_KEY=SG.your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   CRON_SECRET=your-production-cron-secret
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Step 4: Set Up Database Schema

After successful deployment:

1. **Run Database Migration**
   ```bash
   # Clone your repository locally if not already done
   git clone https://github.com/yourusername/accounting-firm.git
   cd accounting-firm
   
   # Install dependencies
   npm install
   
   # Set up environment variables locally
   cp .env.example .env.local
   # Edit .env.local with your production DATABASE_URL
   
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with sample data
   npm run db:seed
   ```

### Step 5: Configure SendGrid

1. **Create SendGrid Account**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Verify your email address

2. **Set Up Sender Authentication**
   - Go to Settings > Sender Authentication
   - Choose "Single Sender Verification" for quick setup
   - Or set up domain authentication for production

3. **Create API Key**
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Choose "Full Access" or create restricted key with Mail Send permissions
   - Copy the API key and add it to your Vercel environment variables

### Step 6: Set Up Cron Jobs (Optional)

For automated tasks like booking reminders:

1. **Create vercel.json**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron",
         "schedule": "0 9 * * *"
       }
     ]
   }
   ```

2. **Redeploy**
   ```bash
   git add vercel.json
   git commit -m "Add cron jobs"
   git push origin main
   ```

## 🐳 Docker Deployment

For containerized deployment:

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/accounting_firm
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=accounting_firm
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Step 3: Deploy

```bash
# Build and run
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

## ☁️ AWS Deployment

### Using AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Set Environment Variables**
   Add all required environment variables in the Amplify console

### Using AWS ECS

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name accounting-firm
   ```

2. **Build and Push Docker Image**
   ```bash
   # Build image
   docker build -t accounting-firm .
   
   # Tag for ECR
   docker tag accounting-firm:latest 123456789012.dkr.ecr.region.amazonaws.com/accounting-firm:latest
   
   # Push to ECR
   docker push 123456789012.dkr.ecr.region.amazonaws.com/accounting-firm:latest
   ```

3. **Create ECS Service**
   - Create task definition
   - Set up service with load balancer
   - Configure environment variables

## 🌐 Custom Server Deployment

For deployment on your own server:

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Create database user
sudo -u postgres createuser --interactive
# Enter username: accounting_firm
# Superuser: n
# Create databases: y
# Create roles: n

# Create database
sudo -u postgres createdb accounting_firm

# Set password
sudo -u postgres psql
ALTER USER accounting_firm PASSWORD 'your_secure_password';
\q
```

### Step 3: Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/accounting-firm.git
cd accounting-firm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Build application
npm run build

# Run database migrations
npx prisma generate
npx prisma db push
npm run db:seed

# Start with PM2
pm2 start npm --name "accounting-firm" -- start
pm2 save
pm2 startup
```

### Step 4: Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Your application URL | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Random 32+ character string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key for emails | Mock mode if not set |
| `FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` |
| `CRON_SECRET` | Secret for cron endpoints | `default-cron-secret` |

## 🔍 Post-Deployment Checklist

### Functionality Testing

- [ ] Home page loads correctly
- [ ] User registration works
- [ ] User login works with demo accounts
- [ ] Booking system functions
- [ ] Admin panel accessible
- [ ] Email sending works (check spam folder)
- [ ] Database operations work
- [ ] Mobile responsiveness

### Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Admin accounts have strong passwords
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Performance Optimization

- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN set up (if needed)
- [ ] Database indexed
- [ ] Monitoring enabled

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection Issues**
```bash
# Test connection
npx prisma db pull
```

**Email Not Sending**
- Check SendGrid API key
- Verify sender authentication
- Check spam folder
- Review application logs

**Authentication Issues**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches domain
- Clear browser cookies

### Getting Help

- Check application logs
- Review environment variables
- Test database connectivity
- Verify external service configurations

## 📊 Monitoring

### Recommended Monitoring Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: User session recording
- **Uptime Robot**: Uptime monitoring

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that you can use for monitoring:

```bash
curl https://yourdomain.com/api/health
```

This endpoint checks:
- Database connectivity
- Email service status
- Authentication system
- API functionality

---

**Need help with deployment? Contact our support team or check the main README for additional resources.**


## ⚓ Netlify Deployment (Recommended for this repo)

This repository includes a Netlify deployment configuration (netlify.toml) that runs Prisma migrations and seeds during builds when a database URL is present. Follow these steps and best practices to deploy safely on Netlify.

### Key repo notes
- netlify.toml contains build commands which run Prisma generate, a prisma-init step and a retry script for migrations (scripts/prisma-deploy-retry.sh) to handle advisory lock contention.
- The build will only run migrations when NETLIFY_DATABASE_URL (or NETLIFY_DATABASE_URL_UNPOOLED) is provided; otherwise migrations/seed are skipped to avoid accidental schema changes on preview/branch deploys.

### Recommended Netlify deployment steps
1. In Netlify, create a new site and connect your Git repository.
2. Under Site settings → Build & deploy, verify the build command matches netlify.toml (it should be picked up automatically). Ensure the Publish directory is `.next`.
3. Add required environment variables in Site settings → Build & deploy → Environment:
   - NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED
   - NEXTAUTH_URL (e.g. https://your-site.netlify.app)
   - NEXTAUTH_SECRET
   - SENDGRID_API_KEY
   - FROM_EMAIL
   - CRON_SECRET
   - PRISMA_MIGRATION_ENGINE_ADVISORY_LOCK_TIMEOUT=300000
4. Protect production branch: require PR reviews and passing CI checks before merging to main.
5. Prefer running migrations in the Netlify build using netlify.toml only for production (the repo already handles skipping in previews).

### CI & Pre-deploy checks (recommended)
- Add a CI job (GitHub Actions) to run on PRs that executes:
  - pnpm install --frozen-lockfile
  - pnpm run typecheck
  - pnpm run lint
  - pnpm test:thresholds (and other unit tests)
  - pnpm build (optional in CI for faster Netlify builds)
- If running migrations from CI, use scripts/prisma-deploy-retry.sh to safely apply migrations.

### Backups, rollbacks and monitoring
- Backup DB before major migrations (pg_dump or provider backups).
- Netlify Deploys panel allows atomic rollbacks to previous deploys.
- Configure Sentry for error monitoring and Netlify build alerts for failed deploys.

### Security and secrets
- Store secrets in Netlify environment variables.
- Rotate secrets (NEXTAUTH_SECRET, SENDGRID_API_KEY) regularly.

### Post-deploy smoke tests
- Use scripts/netlify-preview-smoke.js to run post-deploy smoke tests against the deployed URL.
- Verify _prisma_migrations table exists in the target schema (scripts/prisma-init-persistence.ts creates it if missing).

### Suggested MCP Integrations
You can connect the following MCP integrations (Open MCP popover) to help with deployment, monitoring, and data:

- Neon — serverless Postgres (database management, serverless postgres)
- Netlify — deployment, hosting, CDN, build plugins
- Zapier — automation and workflows
- Figma — design-to-code plugin (Get Plugin link in MCP)
- Supabase — alternative DB + auth + realtime
- Builder CMS — content management (Builder.io)
- Linear — project management / issue tracking
- Notion — documentation and runbooks
- Sentry — error monitoring and performance tracing
- Context7 — up-to-date library/framework docs
- Semgrep — SAST/static security scanning
- Prisma Postgres — ORM/database management

To connect MCP servers open the MCP popover in the Builder UI and select the integration you want.

