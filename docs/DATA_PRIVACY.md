# Data Privacy Policy (Project-Level)

This document describes data handling within this codebase. Organizations deploying this software must adapt it to their legal requirements.

## Data Categories
- Account data (users, roles, sessions)
- Tenant metadata and settings
- Business objects (services, bookings, tasks, invoices, expenses)
- Logs and analytics (limited PII; see Sentry configuration)

## Collection & Processing
- Inputs are validated via Zod schemas in `src/schemas`.
- Tenant isolation enforced by design (tenantId fields, RLS helpers, and server-side checks).

## Storage & Encryption
- Data stored in PostgreSQL (configure provider for encryption-at-rest).
- TLS in transit is required; ensure hosting providers enforce HTTPS.

## Access Controls
- Role-based access and tenant scoping in app and API layers.
- Admin features restricted and auditable.

## Retention & Deletion
- Tenants may request deletion via admin workflows; implement data erasure by cascading deletes where appropriate.
- Logs retained per hosting provider defaults unless configured otherwise.

## Third Parties
- Email (SendGrid), Payments (Stripe), Monitoring (Sentry), optional Redis/Upstash.
- Review provider DPAs and configure data minimization.

## Data Subject Requests
- Implement export endpoints for user/tenant data as needed.
- Verify identity before serving DSRs.

## Incident Handling
- Follow docs/INCIDENT_RESPONSE.md; rotate secrets and notify affected users per policy.
