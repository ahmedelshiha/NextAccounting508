# Feature Overviews

## Admin Workspace
- **Dashboards & Analytics:** KPIs, performance metrics, revenue charts, realtime monitors, and observability panels located under `src/app/admin/analytics` and `src/components/admin/analytics`.
- **Bookings Management:** CRUD, bulk actions, pending counts, stats, and migration tools leveraging routes under `src/app/admin/bookings` and API endpoints in `src/app/api/admin/bookings`.
- **Service Requests:** Intake forms, workload dashboards, calendar, analytics, comments, tasks integration, and export tooling within `src/app/admin/service-requests`.
- **Services Catalog:** Service definitions, versions, cloning, bulk updates, analytics, and filters across `src/app/admin/services` and components under `src/components/admin/services`.
- **Tasks Suite:** Multi-view task board, calendar, Gantt, list, and table views with granular filters, dependencies, metrics, bulk actions, and modal workflows under `src/app/admin/tasks`.
- **Settings Shell:** Organization, communication, services, security, system, and integrations tabs using `src/app/admin/settings` and `src/components/admin/settings`.
- **Compliance & Security:** Audit logs, risk centers, health history, permissions, roles, and security settings under `src/app/admin/compliance`, `src/app/admin/security`, and related APIs.

## Client Portal
- **Bookings:** Scheduling, availability preview, confirmations, and task linkage via `src/app/portal/bookings`.
- **Service Requests:** Submission, tracking, rescheduling, comments, task hooks, and export flows (`src/app/portal/service-requests`).
- **Expenses:** Receipt scanning, OCR ingestion, and financial dashboards (`src/app/portal/expenses`).
- **Chat & Notifications:** Live chat, offline queue, realtime connection panel, and notification overlays (`src/components/portal`).
- **Financial Dashboard:** Metrics for invoices, payments, and services consumed, built with `src/components/portal/financial-dashboard`.

## Public & Marketing
- **Landing Pages:** Variant-specific hero layouts, CTAs, testimonials, and quick wins in `src/app/landing` and `src/components/home`.
- **Blog & Resources:** Category/page generation, SEO schema, and content cards (`src/app/blog`, `src/components/seo/SchemaMarkup.tsx`).
- **Tools & Calculators:** ROI calculator, tax tools, and status pages under `src/app/resources` and `src/components/tools`.

## Automation & Communications
- **Email Workflows:** Contact forms, newsletters, booking confirmations, reminders, and admin alerts using SendGrid utilities (`src/lib/email`, `src/app/api/email/*`).
- **Cron Jobs:** Automated reminders, telemetry, and rescan tasks under `/api/cron/*` and Netlify functions (`netlify/functions/cron-*`).
- **Notifications:** Toasts, providers, and admin notification APIs (`src/app/api/admin/notifications`, `src/components/admin/tasks/providers/NotificationProvider`).

## Financial Operations
- **Invoices & Payments:** Invoice sequencing, payment handling, webhook verification, COD flows, and analytics in `src/app/admin/invoices`, `src/app/api/payments`, and `src/app/api/admin/invoices`.
- **Expenses:** Import, categorization, and reporting through `src/app/admin/expenses` and ingestion APIs (`src/app/api/expenses/ingest`).

## Uploads & Document Management
- **Secure Uploads:** Netlify blobs integration, quarantine review dashboards, antivirus scanning, and provider abstraction in `src/lib/uploads-provider.ts` and `src/app/admin/uploads`.
- **ClamAV Service:** Python sidecar (`clamav-service/`) with REST interface (`start.sh`, `app.py`) for scanning attachments.

## Observability & Ops
- **Monitoring:** Perf metrics, cron telemetry, system health dashboards (`src/app/admin/perf-metrics`, `monitoring/`).
- **Admin Footer Diagnostics:** Environment-specific toggles for debugging, SSR safeguards, and test coverage in `tests/admin/layout`.
- **Performance Budgets:** Threshold enforcement via `tests/thresholds.test.ts` and instrumentation in `src/components/dashboard/PerfMetricsReporter`.
