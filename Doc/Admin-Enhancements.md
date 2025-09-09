# Admin Enhancements -- Release Notes & Reference

This document summarizes all **admin-related enhancements** delivered in
this iteration, along with hotfixes, environment requirements, and
recommended next steps.

------------------------------------------------------------------------

## 🚀 Summary (Quick Reference)

  -------------------------------------------------------------------------------------
  Area            Feature / Change                   Status     Key Files
  --------------- ---------------------------------- ---------- -----------------------
  **Security**    RBAC utilities, audit logging      ✅ Done    `src/lib/rbac.ts`,
                                                                `src/lib/audit.ts`

  **APIs**        Users, Analytics, Tasks, Exports,  ✅ Done    `src/app/api/admin/*`
                  Stats, Health, Perf Metrics                   

  **UI**          Dashboard, Users, Audits pages     ✅ Done    `src/app/admin/*`

  **Stability**   Chunk-load recovery, lint/TS fixes ✅ Hotfix  `client-layout.tsx`,
                                                                `rate-limit.ts`

  **Build**       Fixed Next.js 15 route typings,    ✅ Fixed   Multiple
                  NextAuth import bug, ESLint                   
                  cleanup                                       

  **Ops**         DB-less fallbacks, Prisma safe     ✅ Done    `prisma.ts`
                  disable                                       
  -------------------------------------------------------------------------------------

------------------------------------------------------------------------

## ✅ Implemented Enhancements

### Security, RBAC & Auditing

-   **Granular RBAC**
    -   File: `src/lib/rbac.ts`
    -   Permissions: `view_analytics`, `manage_users`,
        `manage_bookings`, `manage_posts`, `manage_services`,
        `manage_newsletter`.
    -   Enforced in admin APIs (users, bookings).
-   **Audit Logging**
    -   File: `src/lib/audit.ts` → persists to `HealthLog`
        (service=\`AUDIT\`) or logs to console if DB absent.
    -   Integrated in:
        -   User role changes → `src/app/api/admin/users/[id]/route.ts`
        -   Bookings create/bulk update/delete →
            `src/app/api/admin/bookings/route.ts`
-   **Client-side Permission Gating**
    -   Hook: `src/lib/use-permissions.ts`
    -   Applied in Dashboard quick actions, Advanced Analytics, and User
        role controls.

------------------------------------------------------------------------

### Admin APIs (New / Updated)

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Endpoint                            Description                        Params                      Returns
  ----------------------------------- ---------------------------------- --------------------------- -----------------------------------------------------------------------
  `GET /api/admin/users`              List users (DB fallback if absent) --                          `[User]`

  `PATCH /api/admin/users/[id]`       Update user role                   `{ role }`                  `{ success }`

  `GET /api/admin/analytics`          Analytics (range-based)            `range=7d|14d|30d|90d|1y`   `{ dailyBookings[], revenueByService[], avgLeadTime, topServices[] }`

  `GET/POST/PATCH /api/admin/tasks`   List/create/update tasks           --                          `[Task]`

  `GET /api/admin/export`             Export CSV                         `entity, format=csv`        `text/csv`
                                      (users/bookings/services/audits)                               

  `GET /api/admin/stats/*`            Stats for bookings/users/posts     `?range=7d|30d|90d|1y`      `{ count, trend }`

  `GET /api/db-check`                 DB health check                    --                          `{ status }`

  `GET/POST /api/health/logs`         System/audit logs                  --                          `[HealthLog]`

  `GET /api/admin/activity`           Recent activity                    `type=AUDIT, limit`         `[Audit]`

  `GET /api/admin/perf-metrics`       Perf snapshot                      --                          `{ pageLoad, apiResponse, uptime, errorRate }`

  `GET /api/admin/system/health`      Aggregated system rollup           --                          `{ db, email, auth, external, summary }`
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

### Admin UI

-   **Dashboard (`src/app/admin/page.tsx`)**
    -   Revenue chart (real booking stats).
    -   DB health indicator (`/api/db-check`).
    -   6-month trends: registrations & posts.
    -   Advanced Analytics (permission-gated).
    -   Unified time-range selector (7d--1y).
    -   Admin Activity feed (`/api/health/logs`).
    -   Upcoming Tasks (API-driven, with skeletons + badges).
    -   Export shortcut: Users CSV.
    -   KPIs aligned with `?range` stats.
-   **Users (`src/app/admin/users/page.tsx`)**
    -   Role update controls (RBAC enforced).
    -   Recent Admin Activity feed.
-   **Audits (`src/app/admin/audits/page.tsx`)**
    -   Searchable, refreshable audit log viewer.

------------------------------------------------------------------------

## 🔧 Build & Lint Fixes (Netlify)

-   **Next.js 15**: fixed dynamic route handler typings
    (`context: { params: Promise<...> }`).
-   **NextAuth**: resolved duplicate import causing
    `[next-auth][CLIENT_FETCH_ERROR]`.
-   **TypeScript/ESLint**:
    -   Removed `any` from CSV generation, analytics charts, audit
        parsing.
    -   Renamed unused vars (`_request`, `_revenuePrevRange`).
    -   Cleaned imports (removed unused `Button`).

------------------------------------------------------------------------

## 🩹 Recent Hotfixes (Stability & TypeScript)

-   **Chunk-load recovery** (`client-layout.tsx`)\
    Auto-reload on `error` / `unhandledrejection` → recovers from
    `ChunkLoadError`.

-   **System Health typing fix** (`system/health/route.ts`)\
    Safer enum comparisons → removed TS2367 errors.

-   **Rate-limit cleanup** (`rate-limit.ts`)\
    Stronger IP extraction (proxy headers) + removed `@ts-expect-error`.

-   **General lint grooming**\
    Removed `any`, unused vars across APIs.

------------------------------------------------------------------------

## ⚙️ Environment Variables

  -----------------------------------------------------------------------
  Variable                              Purpose
  ------------------------------------- ---------------------------------
  `NETLIFY_DATABASE_URL`                Postgres connection (Neon
                                        recommended). Supports `neon://`
                                        and `postgresql://`.

  `NEXTAUTH_URL` / `NEXTAUTH_SECRET`    Required for NextAuth sessions.

  `SENDGRID_API_KEY`                    Enables email service (mock mode
                                        off).

  `CRON_SECRET`                         Secures `/api/cron` access.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 📝 Redeploy Checklist

-   [ ] Set env vars in Netlify (`DB`, `NEXTAUTH`, `SENDGRID`,
    `CRON_SECRET`).\
-   [ ] Trigger fresh deploy & **clear CDN cache** (avoid chunk
    mismatches).\
-   [ ] Run locally before deploy:
    -   `npm run db:push -- --accept-data-loss`\
    -   `npm run db:seed`\
    -   `npm run typecheck`\
    -   `npm run build`\
-   [ ] Inspect Netlify logs for TS/ESLint errors.\
-   [ ] Validate:
    -   RBAC across roles (Client/Staff/Admin)\
    -   Audit log persistence\
    -   Analytics values vs DB

------------------------------------------------------------------------

## 🔒 Security Posture (Current vs Planned)

  -----------------------------------------------------------------------
  Area              Current                    Planned
  ----------------- -------------------------- --------------------------
  RBAC              Enforced in APIs + UI      Expand to all admin
                                               actions

  Audit             Logs persisted (role,      Dedicated model w/
                    bookings)                  metadata, export

  Rate limiting     Role updates, tasks APIs   Origin/IP checks

  Validation        Basic checks only          Zod schemas for all admin
                                               APIs

  Auth              NextAuth                   2FA + optional SSO
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 📌 Recommended Next Steps

**Near-term (next sprint):** - Add Sentry (via MCP) for error & chunk
tracking.\
- Add request validation (zod) + extend rate limiting.\
- Audit log filters + CSV export.\
- Publish hook or CDN invalidation in pipeline.

**Long-term:** - Enhanced analytics (LTV, funnels, service
distribution).\
- Calendar view + bulk operations for bookings/users.\
- i18n support across Admin UI.\
- Full observability (Sentry perf traces, uptime dashboard).\
- Optional MCP integrations (Neon, Netlify, Builder, Sentry).

------------------------------------------------------------------------


---

## 📈 Future Enhancement — Multi-currency Admin Controls (Admin Dashboard)

**Summary:** Add first-class multi-currency support to the platform with admin controls to enable/disable currencies, choose the site's default currency, manage exchange rates (automatic + manual), and provide optional per-item / per-service price overrides. Initial currency set: **USD (base)**, **AED**, **SAR**, **EGP** (expandable).

### Goals
- Allow site operators to present prices in multiple currencies and choose a default site currency from the Admin UI.
- Keep canonical prices consistent and auditable (store canonical/base price in DB).
- Provide accurate, cached exchange rates and a manual override flow for edge cases.
- Ensure checkout and payment flows handle currency properly (gateway constraints must be verified separately).
- Provide RBAC and audit logging for currency operations.

### High-level Approach (recommended)
1. **Canonical pricing strategy (recommended):**
   - Store canonical prices in a single base currency (USD). All product/service `priceCents` are stored in base currency.
   - Display converted values on the storefront using the latest cached exchange rate.
   - Support *optional* per-currency price overrides for services/products where merchants want non-converted prices (e.g., localized pricing, market-specific rounding, promotions).

2. **Exchange rate storage & refresh:**
   - Fetch exchange rates from a reliable provider (exchangerate.host, Fixer, OpenExchangeRates, etc.) and cache them in DB with `fetchedAt` and `source` metadata.
   - TTL-based refresh (e.g., refresh daily, configurable). Add a "Refresh now" admin button to trigger a manual refresh.
   - Fall back to last-known rate or a server-side configurable fallback (e.g., 1.0 for USD→USD) when API is unavailable.

3. **Admin UX:**
   - New Admin page: **Admin → Settings → Currencies**.
     - Table: `Currency`, `Code`, `Symbol`, `Active`, `Default?`, `Decimals`, `LastRate`, `Actions` (Toggle Active, Set Default, Edit Rate).
     - Controls: "Add currency" (add custom code), "Set default currency" radio, "Refresh rates" button, "Export CSV" of rates.
     - Modal to edit a manual override rate for a currency or add per-product price overrides.
   - Link from Service/Product editing screens to "Price overrides" tab (show per-currency manual price inputs).

4. **APIs & endpoints (Admin + Public):**
   - Admin:
     - `GET /api/admin/currencies` — list currencies + meta (RBAC: view_currencies).
     - `POST /api/admin/currencies` — add currency (RBAC: manage_currencies).
     - `PATCH /api/admin/currencies/[code]` — update (active, decimals, symbol, default) (RBAC: manage_currencies).
     - `POST /api/admin/currencies/refresh` — trigger rates refresh (RBAC: manage_currencies).
     - `GET /api/admin/currencies/overrides?entity=services|products&id=...` — list per-entity overrides.
     - `POST /api/admin/currencies/overrides` — create/update override (RBAC: manage_price_overrides).
   - Public / Client:
     - `GET /api/currencies` — public list of active currencies + last rates used for client display.
     - `GET /api/currencies/convert?from=USD&to=EGP&amount=100.00` — conversion helper (optional).
   - Checkout / server-side charge logic should either:
     - Convert displayed currency back to base currency for payment processing, **or**
     - Charge in the customer's currency if payment provider supports that currency (verify provider support).

5. **RBAC & Auditing:**
   - New permissions: `view_currencies`, `manage_currencies`, `manage_price_overrides`.
   - All changes (default currency change, activation/deactivation, manual rate edits, overrides) should create an audit log entry via existing `src/lib/audit.ts` (actor, action, target, old/new value).

6. **Data model (Prisma) — example**
```prisma
model Currency {
  code        String   @id // e.g. "USD", "AED"
  name        String
  symbol      String?
  decimals    Int      @default(2)
  active      Boolean  @default(false)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  rates       ExchangeRate[]
  overrides   PriceOverride[]
}

model ExchangeRate {
  id         Int      @id @default(autoincrement())
  base       String   // e.g. "USD"
  target     String   // e.g. "EGP"
  rate       Float
  source     String?  // provider name
  fetchedAt  DateTime @default(now())
  ttlSeconds Int?     // optional TTL applied when fetched
  @@index([base, target])
}

model PriceOverride {
  id           Int      @id @default(autoincrement())
  entity       String   // 'service' | 'product' | 'post' (if needed)
  entityId     Int
  currencyCode String
  priceCents   Int
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([entity, entityId, currencyCode])
}
```

7. **Environment variables**
- `EXCHANGE_API_PROVIDER` (e.g. exchangerate.host, fixer)
- `EXCHANGE_API_KEY` (if required by provider)
- `EXCHANGE_BASE_CURRENCY` (default `USD`)
- `EXCHANGE_RATE_TTL_SECONDS` (default `86400`) — how long a fetched rate is considered fresh
- `CURRENCY_AUTO_REFRESH_CRON` (optional) — cron schedule for automatic refresh

8. **Background refresh / cron job**
- Add a cron endpoint `/api/cron/refresh-exchange-rates` (protected by `CRON_SECRET`) and/or use scheduled function to refresh rates daily.
- The refresh job will fetch a batch of required currency rates (base → active targets) and upsert `ExchangeRate` rows.

9. **Checkout & Payment gateway considerations**
- **Important:** Not all payment providers support every currency. For each provider used (Stripe, PayPal, etc.) verify supported currencies and rounding rules — *this must be verified at integration time*. If gateway doesn't support a currency, convert to base currency server-side before creating the charge; present messaging to customers that charges are made in `USD` (or default currency).
- Ensure taxes, shipping, and fees are calculated after conversion or use base currency for final math to avoid rounding mismatches.

10. **Formatting & frontend display**
- Use `Intl.NumberFormat` for currency formatting with locale and currency code: e.g.
```ts
new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(amount)
```
- When rendering converted prices, show both converted and base currency (optional) with a tooltip: "approx. X USD".

11. **Migration & rollout plan**
- Add migration with `Currency`, `ExchangeRate`, and `PriceOverride` models.
- Seed base currencies: USD, AED, SAR, EGP (set USD active + default).
- Deploy to staging, enable AED/SAR/EGP as inactive by default; run manual tests.
- Enable auto-refresh in staging and verify rates populate; do end-to-end checkout tests (charge flows).
- Gradually enable currencies in production after validating gateway support & accounting.

12. **Testing**
- Unit tests for conversion util (including rounding rules).
- Integration tests for `/api/currencies` and refresh job with mocked provider responses.
- E2E flow that simulates a user in AED/SAR/EGP region: price display, checkout, and order record currency fields.
- Tests for per-entity price overrides behavior (override present → display override; else converted price).

13. **Edge cases & fallbacks**
- If exchange rate provider fails → use last-known rate and surface a warning banner in Admin "Rates may be stale".
- If no rate exists for requested conversion → deny override creation and advise admin to refresh rates or enter manual value.
- Use integer cents for prices to avoid floating point issues. Use `BigInt`/`Decimal` types where necessary on server calculations.

14. **Audit & monitoring**
- Create audit entries for: default currency change, activate/deactivate currency, manual rate edits, override create/update/delete, background refresh failures.
- Track refresh job success/failure metrics in perf metrics endpoint or Sentry for alerts.

---

### Quick API spec snippets (examples)

**List currencies (public)**
```
GET /api/currencies
Response:
[
  { code: 'USD', name: 'US Dollar', symbol: '$', active: true, isDefault: true, lastRate: 1, decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', active: false, lastRate: 30.123, decimals: 2 }
]
```

**Admin — Refresh rates (trigger)**
```
POST /api/admin/currencies/refresh
Body: { base: 'USD', targets: ['AED','EGP','SAR'] }
Auth: Admin (manage_currencies)
Response: { success: true, updated: [ { target: 'EGP', rate: 30.1, fetchedAt: '...' } ] }
```

---

## ✅ Add to documentation (this file)

I have drafted the design above as a recommended **Future Enhancement**. The multi-currency feature has now been implemented in this iteration — see the summary below.

## ✅ Implemented — Multi-currency Admin Controls (Admin Dashboard)

**Status:** Implemented in this iteration (Prisma models, seed, APIs, admin UI, cron, RBAC and audit integration, CSV export, basic test script).

### Summary
Multi-currency support is now available: currencies can be added/activated, a default base currency is honored, exchange rates are fetched and cached, per-entity price overrides are supported, and admin actions are permissioned and audited.

### Key files added / modified
- prisma/schema.prisma — added models: `Currency`, `ExchangeRate`, `PriceOverride`
- prisma/seed.ts — seeds USD, AED, SAR, EGP + baseline USD→USD rate
- src/lib/exchange.ts — fetchRates, convertCents helpers
- src/lib/rbac.ts — added permissions: `view_currencies`, `manage_currencies`, `manage_price_overrides`
- src/app/api/admin/currencies/route.ts — GET/POST admin currencies
- src/app/api/admin/currencies/[code]/route.ts — PATCH currency
- src/app/api/admin/currencies/refresh/route.ts — POST refresh rates (manual)
- src/app/api/admin/currencies/export/route.ts — GET CSV export
- src/app/api/admin/currencies/overrides/route.ts — GET/POST per-entity overrides (audit hooked)
- src/app/api/currencies/route.ts — public list of active currencies + rates
- src/app/api/currencies/convert/route.ts — simple convert helper
- src/app/api/cron/refresh-exchange-rates/route.ts — protected cron endpoint (x-cron-secret header)
- src/components/admin/currency-manager.tsx — client UI for managing currencies
- src/app/admin/settings/currencies/page.tsx — Admin page (Settings → Currencies)
- scripts/test-currency-util.ts — small test script for convertCents

### RBAC & Audit
- Admin actions require the new permissions and will return 401 when unauthorized. Audit entries are recorded using `src/lib/audit.ts` for price override create/update and exchange refresh events.

### Environment variables (required)
- NETLIFY_DATABASE_URL — Postgres connection (Neon recommended)
- EXCHANGE_API_PROVIDER — e.g. `exchangerate.host` (defaults to exchangerate.host)
- EXCHANGE_API_KEY — if provider requires a key
- EXCHANGE_BASE_CURRENCY — default `USD`
- EXCHANGE_RATE_TTL_SECONDS — default `86400`
- CRON_SECRET — used to protect `/api/cron/refresh-exchange-rates`

### How to run (local / CI)
1. Connect DB and set NETLITY_DATABASE_URL (or NEON) and other env vars.
2. Run migrations / push schema: `npm run db:push -- --accept-data-loss` or run `prisma migrate` as appropriate.
3. Seed DB: `npm run db:seed`.
4. Start dev server: `npm run dev`.
5. Admin UI: Visit `/admin/settings/currencies` to manage currencies. Use the "Refresh rates" button or call `POST /api/admin/currencies/refresh`.
6. Cron: Call `POST /api/cron/refresh-exchange-rates` with header `x-cron-secret: <CRON_SECRET>` to trigger scheduled refreshes.

### Notes & Edge cases
- When DB is not configured, audit logs fallback to console (existing behavior). Currency APIs expect DB; public fallback is not implemented for currencies — ensure NETLIFY_DATABASE_URL is set to use features.
- Exchange rate provider failures fall back to existing DB values; admin UI surfaces success/failure messages.
- Prices use integer cents; conversion uses `convertCents` in `src/lib/exchange.ts` to avoid floating-point errors.

### Tests & QA
- A basic conversion test script is available at `scripts/test-currency-util.ts`. Add unit and integration tests as next steps (mock provider responses, E2E checkout flows).

---

### Admin UI — Quick Change Modal (Dashboard quick action)
- Added a client-side Quick Change Currency modal accessible from the Admin Dashboard Quick Actions (visible to users with `manage_currencies`).
- File: `src/components/admin/currency-quick-modal.tsx` — a lightweight dialog that:
  - Lists currencies with editable fields (symbol, decimals, active).
  - Allows selecting and setting the default currency without leaving the dashboard.
  - Saves individual currency edits (PATCH `/api/admin/currencies/[code]`).
  - Shows confirmation toasts using `sonner` for success/error feedback.
- Dashboard integration: `src/app/admin/page.tsx` — added quick action button that opens the modal and exposes it only to users with the appropriate permission.
- Permissions: `usePermissions` exposes `canManageCurrencies` and `canManagePriceOverrides` to gate access.

### Per-entity Price Override UI (in modal)
- The Quick Change modal now includes per-entity price override management (visible to users with `manage_price_overrides`):
  - Select entity type (`services` | `products`) and enter an entity ID.
  - Load existing overrides using `GET /api/admin/currencies/overrides?entity=...&id=...`.
  - Edit existing overrides (price) and save via `POST /api/admin/currencies/overrides`.
  - Create new overrides for the selected entity and currency.
- Files: `src/components/admin/currency-quick-modal.tsx`, `src/app/api/admin/currencies/overrides/route.ts` (existing endpoint used).
- UX notes: price inputs accept human-readable amounts (e.g., `100.00`) and are converted to cents server-side.

If you want, I can also:
- Add automated unit tests and a GitHub Actions workflow to run them, or
- Run the DB push & seed here once you connect Neon (click [Open MCP popover](#open-mcp-popover) and connect Neon), then I can execute migration and seed for you.

