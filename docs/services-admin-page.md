# Admin Services Management Page

This document describes the enhanced Admin Services Management page, its architecture, endpoints, analytics, and how to operate and extend it.

- UI entry point: `src/app/admin/services/page.tsx`
- Retired (backup) page: `backup/retired-admin-services-page.tsx`
- Related server endpoints:
  - `GET /api/admin/services` (admin list + filters)
  - `POST /api/services` (create)
  - `PUT /api/services/[slug]` (update)
  - `DELETE /api/services/[slug]` (soft delete)
  - `GET /api/currencies/convert` (rate preview)
  - `GET /api/admin/analytics?range=7d|14d|30d|90d|1y` (dashboard analytics)

## Overview

The page provides a complete service catalog management experience with:
- Grid/table switchable view
- Create/edit forms with validation
- Search, filter by category, featured toggle, and inactive visibility
- Bulk actions (activate/deactivate, feature/unfeature, delete)
- Currency conversion preview and apply
- Analytics dashboard with charts (daily bookings, revenue by service, top services, lead time)

It integrates with existing API routes and Prisma models; if a database is not provisioned, admin endpoints provide a small in-memory fallback (see `src/app/api/admin/services/route.ts`).

## Key UI Features

1) Listing and Filters
- Search by name, slug, short description
- Toggle: featured-only or non-featured
- Category filter (auto-built from current services)
- Show/hide inactive services
- Grid or table layout

2) CRUD
- Create: name, slug, short description, description, price, duration, category, featured
- Edit: same fields (slug is fixed after creation)
- Delete: soft-deletes by setting `active=false`
- Duplicate: clone existing service with unique slug

3) Bulk Actions
- Activate/deactivate
- Feature/unfeature
- Delete (with confirmation)

4) Currency Conversion
- Opens a modal to preview the exchange rate via `GET /api/currencies/convert`
- Applies conversion across priced services using `PUT /api/services/[slug]`

5) Analytics
- Range: 7d, 14d, 30d, 90d, 1y
- Data source: `GET /api/admin/analytics`
- Charts: line/area (daily bookings), horizontal bars (revenue by service), donut (revenue share), pie (active vs inactive)

## Data Model (Prisma `Service`)

`prisma/schema.prisma`:
- `id: String @id @default(cuid())`
- `name: String`
- `slug: String @unique`
- `description: String @db.Text`
- `shortDesc: String?`
- `features: String[]`
- `price: Decimal?`
- `duration: Int?`
- `category: String?`
- `active: Boolean @default(true)`
- `featured: Boolean @default(false)`
- `image: String?`
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

The UI uses a compatible `Service` interface and converts numeric fields when calling APIs.

## API Contract (Client Usage)

- Load (with filters):
  - `GET /api/admin/services?featured=true|false&active=true|false&search=term`
- Create:
  - `POST /api/services` with JSON body `{ name, slug, description, shortDesc?, price?, duration?, category?, featured?, image? }`
- Update:
  - `PUT /api/services/[slug]` with partial JSON `{ name?, description?, shortDesc?, price?, duration?, category?, featured?, active?, image? }`
- Delete:
  - `DELETE /api/services/[slug]` (soft delete)
- Currency preview:
  - `GET /api/currencies/convert?from=USD&to=EUR&amount=1`
- Analytics:
  - `GET /api/admin/analytics?range=14d`

See also: `Doc/services-api-documentation.md` for broader API details.

## Analytics & Charts

Data shape from `/api/admin/analytics`:
- `dailyBookings: { date | day, count }[]`
- `revenueByService: { service, amount }[]`
- `topServices: { service, bookings }[]`
- `avgLeadTimeDays: number`

Rendered charts (pure SVG, no extra deps):
- `LineAreaChart`: daily bookings trend
- `HBarChart`: top revenue services
- `PieDonutChart` (donut): revenue share (top 5 + Other)
- `PieDonutChart` (pie): active vs inactive services

These components live inline in `src/app/admin/services/page.tsx` for simplicity and zero-dependency rendering.

## Permissions & Auth

- Admin endpoints check session and role; see `src/lib/auth.ts` and `src/lib/rbac` helpers.
- Without DB (`NETLIFY_DATABASE_URL` unset), admin services returns a fallback dataset for basic UX.

## Error Handling

- User feedback provided via `sonner` toasts (success/failure)
- Guarded conversions and bulk ops with confirmations and error catches
- Graceful fallback if analytics or rates are unavailable

## How to Use

1. Navigate to `/admin/services`.
2. Use search and filters to locate services.
3. Create or edit via the right-hand form; save changes.
4. Select multiple items to run bulk actions.
5. Open Currency Converter to preview rates and apply conversions.
6. Review Analytics; switch ranges to compare trends.

## Extensibility

- Add new charts: extend the SVG helpers or integrate a chart lib if desired.
- Add fields: update Prisma schema, API routes, and the form state in the page.
- Additional bulk actions: extend `applyBulk()` in the page.
- Import/Export: integrate `GET /api/admin/services/export` and `POST /api/admin/services/import` per the API docs.

## Reverting

- The previous admin services page is preserved at:
  - `backup/retired-admin-services-page.tsx`
- You can restore it via the History tab or by moving the backup file back to `src/app/admin/services/page.tsx` using the platform UI.

## Testing Checklist

- Create service (required fields only)
- Edit service (toggle active/featured, update price/duration)
- Delete service (soft delete)
- Search and filters (featured, inactive, category)
- Bulk activate/deactivate/feature/unfeature/delete
- Currency conversion preview + apply
- Analytics loads for all ranges and charts render

## Notes

- Keep UI styles consistent with existing components (Tailwind + shadcn/ui)
- Do not log secrets or commit environment values
- Follow repo ESLint/TypeScript rules (`npm run lint`, `npm run typecheck`)
