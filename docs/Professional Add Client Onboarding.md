# Professional Add Client Onboarding

A comprehensive, admin-only flow to create new client accounts with validation, preferences, and review.

## Summary
- Route: `/admin/clients/new`
- Trigger: Admin Dashboard → Smart Actions → “Add Client”
- Purpose: Streamlined client onboarding with 7 steps and robust validation
- Result: Creates a CLIENT user via `/api/auth/register` and redirects to `/admin/users`

## Access & Permissions
- Audience: Admin/Staff only (linked from Admin panel)
- Authentication: Depends on your existing NextAuth session role checks

## UX Flow (7 Steps)
1) Basic Information
   - Fields: name, email (debounced duplicate check), phones, company, job title, industry, business type, tax ID
   - Validation: required name/email, email format, phone format, basic tax ID checks
2) Address
   - Address, city, state, postal code, country
3) Client Classification
   - Tier (individual/smb/enterprise), source, urgency, optional “referred by”
4) Service Preferences
   - Preferred contact method & frequency
   - Services of interest (fetched from `/api/services`) grouped by category
5) Financial Information
   - Estimated annual revenue, estimated budget, payment terms, optional billing address
6) Additional Details
   - Internal notes, special requirements, tags, status flags (active, requires onboarding, marketing opt-in), GDPR consent checkbox
7) Review & Confirm
   - Read-only summary of all inputs; submit creates account

## APIs Used
- POST `/api/auth/register`
  - Body: `{ name, email, password }`
  - Behavior: hashes password, creates user with role `CLIENT`
- GET `/api/services`
  - Returns service catalog (DB-backed; falls back to static list if DB unavailable)
- GET `/api/users/check-email?email=...`
  - Returns `{ exists: boolean }` to prevent duplicates (returns `false` when DB is unavailable)

## Implementation Locations
- Page UI: `src/app/admin/clients/new/page.tsx`
- Email check endpoint: `src/app/api/users/check-email/route.ts`
- Register endpoint: `src/app/api/auth/register/route.ts`
- Services endpoint: `src/app/api/services/route.ts`
- Prisma client: `src/app/lib/prisma.ts`
- Schema: `prisma/schema.prisma` (User, Service, etc.)

## Behavior Details
- Debounced email duplicate check (500ms) with loading and error indicators
- Step validation blocks navigation until required fields are valid
- GDPR consent required on final step
- On submit: generates a secure temporary password (12 chars), calls `/api/auth/register`, shows success with temp password, then redirects to `/admin/users`

## Data & Persistence
- Current persistence: name, email, password (hashed), role=CLIENT
- Collected but not yet persisted: address, business details, classification, preferences, financials, notes, tags, flags

### Extending Persistence (optional)
1) Update `/api/auth/register` to accept a `metadata` object and store it (e.g., using a JSON column or related tables)
2) Update the submit payload in `src/app/admin/clients/new/page.tsx` to include all collected fields
3) Consider adding models (e.g., `ClientProfile`, `ClientPreference`) to `schema.prisma` with a 1:1 relation to `User`

## Environment Requirements
- Database URL: `NETLIFY_DATABASE_URL` (Neon via Netlify recommended)
  - If missing, `/api/services` falls back to a static list; email check returns `exists: false`

## Error Handling & UX
- Clear inline validation messages
- Loading indicators for API calls
- Graceful fallbacks when DB is unavailable

## QA Checklist
- Email duplicate prevention triggers for existing users
- Unable to advance without required fields
- GDPR consent required on step 7
- Services load correctly (or fallback list when DB is absent)
- Success state shows temp password then redirects to `/admin/users`

## Troubleshooting
- 500/400 on register: Check server logs and ensure `NETLIFY_DATABASE_URL` is set
- Email check always false: Ensure DB env var is configured and reachable
- Services empty: Confirm records exist or rely on fallback; verify endpoint

## Changelog
- 2025-09-10: Initial implementation and documentation
