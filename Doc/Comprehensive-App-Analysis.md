# Accounting Firm App — Comprehensive Analysis and Architecture Report

This report documents the full structure, scope, features, data model, APIs, UI, and integration architecture of the Accounting Firm application.

## 1) Project Structure & Scope

- Framework: Next.js App Router (src/app), React 19, TypeScript
- Styling/UI: Tailwind CSS v4, custom UI components (Card, Button, Badge, Dialog, Dropdown, etc.)
- Auth: NextAuth Credentials provider with Prisma adapter (when DB available)
- Database: PostgreSQL via Prisma (NETLIFY_DATABASE_URL; Neon-friendly), decimal-safe price handling
- Email: SendGrid (optional, graceful fallback to console)
- i18n: Lightweight translation context with JSON locales (en, ar, hi)
- Currency/FX: Exchange rates persisted, conversions, overrides
- Admin: Rich admin panel for bookings, services, users, newsletter, currencies, analytics, audits
- Client Portal: Bookings + Settings

Key directories/files:
- prisma/schema.prisma — full relational schema (Users, Services, Bookings, Currencies, etc.)
- src/lib/* — prisma client, auth, email, exchange, rbac, validation, utils
- src/app/api/** — REST-like endpoints for public/admin features
- src/app/**/page.tsx — pages (marketing, portal, admin, blog, booking, etc.)
- src/components/** — UI and feature components
- netlify/functions/health-monitor.ts — serverless monitor

## 2) Key Features

- Booking System
  - 5-step admin booking wizard: client selection, service, schedule, details, review
  - Client portal to view/manage own bookings
  - Conflict detection and status lifecycle (PENDING, CONFIRMED, COMPLETED, etc.)
  - Optional ICS calendar attachments and email notifications
- Services Catalog
  - Public services list and detail pages
  - Admin service management (create; active/featured flags; category, duration, price)
- User & Roles
  - Roles: CLIENT, ADMIN, STAFF
  - Admin/staff elevated capabilities (view all bookings, analytics, settings)
- Multi-currency
  - Currency catalog with active/default, decimals
  - Exchange rates fetch/persist via exchangerate.host
  - Price overrides per entity/currency
- Content & Marketing
  - Blog/posts with authoring, featured control, tags, views
  - Newsletter subscribe/unsubscribe
  - Contact form submissions
- Operations & BI
  - Health logs & system health
  - Admin analytics and stats dashboards
  - Performance metrics endpoint scaffold

## 3) Services System

- Model: Service
  - id, name, slug, description, shortDesc, features[], price (Decimal), duration, category, active, featured, image, timestamps
- APIs
  - GET /api/services — active services with optional ?featured=true&category=...
  - POST /api/services — create service (admin-only, validated)
  - GET /api/admin/services — admin listing/management (see codebase)
  - GET /api/services/[slug] — fetch by slug
- UI Consumption
  - Home/services sections and admin/services screen
  - Booking wizard maps DB services to UX model with duration-based complexity and requirements derived from features

## 4) Business Intelligence Features

- Admin Stats (src/app/api/admin/stats/bookings/route.ts)
  - Counts by status (pending, confirmed, completed, cancelled)
  - Today, this month, last month, growth %, upcoming (7 days)
  - Revenue: total, thisMonth, lastMonth, growth% (price sums via decimal utils)
  - Optional range window (7d/30d/90d/1y) with bookings/revenue/growth
- Admin Analytics (src/app/api/admin/analytics/route.ts)
  - Daily bookings time-series
  - Revenue by service (completed bookings)
  - Average lead time (createdAt→scheduledAt)
  - Top services by bookings within range
- Performance Metrics (src/app/api/admin/perf-metrics/route.ts)
  - Placeholder metrics with structure for real integration (Sentry/Lighthouse/Netlify)

## 5) UI Elements

- Design System
  - Cards, Buttons, Badges, Dropdown Menu, Dialogs, Inputs, Forms, Toasts (Radix underpinnings)
- Pages
  - Public: Home, About, Services, Blog (+slug, category), Contact, Careers, FAQ, Resources (tax calendar, tools)
  - Auth: Login, Register
  - Client Portal: /portal, /portal/bookings, /portal/settings, /portal/bookings/[id]
  - Admin: /admin with sections for bookings, services, users, posts, newsletter, audits, settings (currencies), perf/analytics
- Navigation
  - Role-aware profile menu (admin sees Admin Panel first; My Bookings hidden for admin/staff)

## 6) Technical Highlights

### 6.1 Database Integration
- Prisma client wrapper (src/lib/prisma.ts)
  - Accepts NETLIFY_DATABASE_URL; converts neon:// to postgresql://
  - Uses singleton in dev; exports throwing proxy when DB not configured (safe fallback)
- Prisma schema (prisma/schema.prisma) aligns to features: User/Account/Session/VerificationToken, Post, Service, Booking, Currency/ExchangeRate/PriceOverride, Newsletter, ContactSubmission, Task, HealthLog

### 6.2 Real API Calls vs. Fallbacks
- Many APIs consult NETLIFY_DATABASE_URL to decide:
  - /api/services — returns DB results; falls back to static demo list when DB not present or on runtime errors
  - /api/admin/users — returns DB users (role + info) or demo users when DB not present
- Booking wizard (src/app/admin/bookings/new/page.tsx)
  - Fetches /api/services and /api/admin/users, maps to internal UI model
  - Staff list currently mocked (see Extensions section in its doc)

### 6.3 Database Schema Alignment & Persistence
- Booking creation (POST /api/bookings)
  - Validates inputs, looks up service, computes duration, checks time conflicts
  - Admin/Staff may specify clientId, else uses session user
  - Persists booking and returns record including selected service summary
- Services creation (POST /api/services) with unique slug constraint and validations
- Exchange rates persisted via src/lib/exchange.ts into ExchangeRate table
- PriceOverride & Currency models support currency-specific pricing rules

### 6.4 Error Handling & Validation
- Standardized NextResponse JSON with appropriate status codes (400/401/404/500)
- Role checks via NextAuth session + rbac utility
- Graceful degraded behavior (fallback demo data) when DB/env not present
- Decimal-safe revenue calculations (src/lib/decimal-utils.ts) used by admin stats

### 6.5 Integration Points
- Authentication: NextAuth (Credentials + PrismaAdapter when DB exists)
- Email: SendGrid (sendEmail; booking confirmation with ICS support via generateICS)
- FX Rates: exchangerate.host (persisted rates with TTL)
- Hosting: Netlify (netlify/functions/health-monitor.ts)
- Neon: URL rewrite compatibility in prisma client

## 7) API Endpoints (Inventory)

Public/Shared:
- GET/POST /api/bookings
- GET /api/bookings/[id]
- POST /api/bookings/[id]/confirm
- GET /api/bookings/availability
- GET /api/services
- GET /api/services/[slug]
- GET /api/posts, GET /api/posts/[slug]
- GET /api/newsletter, POST /api/newsletter, POST /api/newsletter/unsubscribe
- POST /api/contact
- GET /api/users/me, GET /api/users/check-email
- GET /api/currencies, GET /api/currencies/convert
- GET /api/cron, GET /api/cron/refresh-exchange-rates
- GET /api/db-check, GET /api/health/logs, GET /api/email/test
- GET/POST /api/auth/[...nextauth], POST /api/auth/register

Admin:
- GET /api/admin/users, GET /api/admin/users/[id]
- GET /api/admin/services
- GET /api/admin/bookings
- GET /api/admin/stats/bookings, GET /api/admin/stats/posts, GET /api/admin/stats/users
- GET /api/admin/analytics
- GET /api/admin/perf-metrics
- GET /api/admin/currencies, GET /api/admin/currencies/[code]
- POST /api/admin/currencies/refresh, GET /api/admin/currencies/export
- POST/GET /api/admin/currencies/overrides
- GET /api/admin/system/health
- GET /api/admin/activity, GET /api/admin/export, GET /api/admin/tasks (+ /api/admin/tasks/[id])

Note: Some endpoints provide demo responses when DB/env is absent.

## 8) Database Flow (Examples)

- Booking Creation
  1. Client/admin submits POST /api/bookings with serviceId, scheduledAt, client details
  2. API validates, loads service, calculates duration, checks conflicts
  3. Determines clientId (admin/staff may set clientId; otherwise session user)
  4. Persists booking; returns JSON including service summary
  5. Optional confirmation email flow can use sendBookingConfirmation with ICS attachment

- Exchange Rates Refresh
  1. fetchRates(targets) calls exchangerate.host
  2. Upserts ExchangeRate rows with TTL, timestamps, base and target
  3. /api/currencies returns active currencies and latest base→target rates

## 9) Replace Mock Data with Real Integrations

- Enable DB persistence
  - Set NETLIFY_DATABASE_URL to a reachable Postgres (Neon supported)
  - Prisma adapter will be active; APIs will switch from demo to real queries
- Staff data in booking wizard
  - Replace local mock with a real endpoint (e.g., GET /api/staff) and hook into availability logic
- Email notifications
  - Set SENDGRID_API_KEY and optional FROM_EMAIL to deliver real emails with ICS attachments
- Exchange rates
  - Ensure active currencies populated; fetchRates persists rates for convert/UX

## 10) Security & RBAC

- Roles embedded in JWT session; admin/staff gating for admin endpoints
- Session invalidation via sessionVersion check in JWT callback
- API routes validate session presence and authorization

## 11) Known Behaviors & Operational Notes

- Services and admin/users endpoints gracefully fallback when DB is not configured
- Booking conflict window: 1-hour buffer around scheduledAt
- Prices stored as Decimal; revenue uses decimal utils to avoid float errors
- Navigation adapts for admin/staff (My Bookings hidden; Admin Panel prioritized)

## 12) Suggested Next Steps

- Implement real Staff directory/availability endpoint; integrate into scheduling
- Add webhooks/queue for reminder emails and confirmation upon status changes
- Expand BI: cohort analytics, retention, revenue projections, source attribution
- Harden validations with shared zod schemas and client-side inline messages
- Add Sentry MCP for error monitoring and dashboards
