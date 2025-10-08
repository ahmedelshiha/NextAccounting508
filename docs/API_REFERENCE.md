# API Reference Overview

This document orients you to the API surface exposed under `src/app/api`. For a machine-readable schema, see `openapi/admin-services.json`.

## Authentication
- `POST /api/auth/[...nextauth]` — NextAuth.js routes
- `POST /api/auth/register` — Registration
- Dev login (development only): `/api/_dev/login` — canonical dev-only login. Note: legacy `/api/dev-login` redirects to this route.

## Public & Content
- `GET /api/posts`, `GET /api/posts/[slug]`
- `GET /api/pricing`
- `POST /api/contact`

## Bookings & Services
- `GET/POST /api/bookings`
- `GET/PATCH /api/bookings/[id]`
- `POST /api/bookings/[id]/confirm`, `POST /api/bookings/[id]/comments`, `POST /api/bookings/[id]/tasks`
- `GET /api/services`, `GET /api/services/lite`, `GET /api/services/[slug]`
- WebSocket: `/api/ws/bookings`

## Admin Suite
- `GET /api/admin/analytics`, `GET /api/admin/stats/*`
- `GET/POST /api/admin/bookings`, `/api/admin/services`, `/api/admin/tasks`
- Settings: `/api/admin/*-settings` (export/import endpoints available)
- Team & Permissions: `/api/admin/team-*`, `/api/admin/permissions/*`
- Health & System: `/api/admin/system/health`

## Portal
- `/api/portal/service-requests/*`, `/api/portal/chat`, `/api/portal/realtime`

## Payments & Invoicing
- `POST /api/payments/checkout`, `/api/payments/cod`, `/api/payments/webhook`
- `POST /api/admin/invoices/[id]/pay`

## Currencies & Tools
- `/api/currencies`, `/api/currencies/convert`
- `/api/tools/roi`, `/api/tools/tax`

## Cron & Monitoring
- `/api/cron/reminders`, `/api/cron/refresh-exchange-rates`, `/api/cron/rescan-attachments`, `/api/cron/telemetry`
- `/api/monitoring`, `/api/security/events`, `/api/security/health`

## OpenAPI
- `openapi/admin-services.json` describes admin services endpoints; expand as needed.

Refer to `src/app/api/**/route.ts` for authoritative implementations and to `src/schemas` for Zod validators.
