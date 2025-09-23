# Admin Booking Settings — Implementation TODO (Next.js + Prisma + Netlify)

Goal: Ship a production-grade Booking Settings module (admin) with RBAC, audit logging, import/export, and a clean UI, leveraging Next.js App Router, Prisma (Postgres on Netlify), and existing project patterns.


## 0) Current State Audit

- Prisma schema lacks BookingSettings-related models (BookingSettings, BookingStepConfig, BusinessHoursConfig, PaymentMethodConfig, NotificationTemplate, AuditLog).
- No API routes under `src/app/api/admin/booking-settings/*`.
- No `src/services/booking-settings.service.ts` or `src/types/booking-settings.types.ts`.
- Admin settings page exists (`src/app/admin/settings/page.tsx`), but no Booking Settings subpage.
- Permissions do not include booking-specific keys (see `src/lib/permissions.ts`).
- Netlify + Next.js + Prisma infrastructure is already configured (see `netlify.toml`, `package.json`).


## 1) Data Model (Prisma) — add models and indexes

Update `prisma/schema.prisma` with the following models and constraints. Keep naming consistent with existing conventions and enable tenant/org extension later if needed.

- BookingSettings (one per org/tenant, unique)
- BookingStepConfig (steps order + toggles)
- BusinessHoursConfig (per day config)
- PaymentMethodConfig (method toggles and limits)
- NotificationTemplate (email/SMS templates)
- AuditLog (generic audit trail for admin ops)

Example Prisma models (adapt names/@@map as needed to match table naming style):

```prisma
model BookingSettings {
  id                       String   @id @default(cuid())
  organizationId           String   @unique
  // General
  bookingEnabled           Boolean  @default(true)
  requireApproval          Boolean  @default(false)
  allowCancellation        Boolean  @default(true)
  allowRescheduling        Boolean  @default(true)
  cancellationDeadlineHours Int     @default(24)
  rescheduleDeadlineHours  Int      @default(4)
  // Payments
  paymentRequired          Boolean  @default(false)
  acceptCash               Boolean  @default(true)
  acceptCard               Boolean  @default(true)
  acceptBankTransfer       Boolean  @default(false)
  acceptWire               Boolean  @default(false)
  acceptCrypto             Boolean  @default(false)
  requireFullPayment       Boolean  @default(false)
  allowPartialPayment      Boolean  @default(true)
  depositPercentage        Int      @default(50)
  // Steps
  enableServiceSelection   Boolean  @default(true)
  enableDateTimeSelection  Boolean  @default(true)
  enableCustomerDetails    Boolean  @default(true)
  enableAdditionalServices Boolean  @default(true)
  enablePaymentStep        Boolean  @default(false)
  enableConfirmationStep   Boolean  @default(true)
  enableFileUpload         Boolean  @default(false)
  enableSpecialRequests    Boolean  @default(true)
  // Availability
  advanceBookingDays       Int      @default(365)
  minAdvanceBookingHours   Int      @default(2)
  maxBookingsPerDay        Int      @default(50)
  maxBookingsPerCustomer   Int      @default(5)
  bufferTimeBetweenBookings Int     @default(15)
  // Calendars
  businessHours            Json?
  blackoutDates            Json?
  holidaySchedule          Json?
  // Notifications
  sendBookingConfirmation  Boolean  @default(true)
  sendReminders            Boolean  @default(true)
  reminderHours            Json?    // array of ints, e.g. [24,2]
  notifyTeamMembers        Boolean  @default(true)
  emailNotifications       Boolean  @default(true)
  smsNotifications         Boolean  @default(false)
  // Customer
  requireLogin             Boolean  @default(false)
  allowGuestBooking        Boolean  @default(true)
  showPricing              Boolean  @default(true)
  showTeamMemberSelection  Boolean  @default(false)
  allowRecurringBookings   Boolean  @default(false)
  enableWaitlist           Boolean  @default(false)
  // Assignment
  enableAutoAssignment     Boolean  @default(false)
  assignmentStrategy       String   @default("ROUND_ROBIN")
  considerWorkload         Boolean  @default(true)
  considerSpecialization   Boolean  @default(true)
  // Pricing
  enableDynamicPricing     Boolean  @default(false)
  peakHoursSurcharge       Decimal  @default(0.0)
  weekendSurcharge         Decimal  @default(0.0)
  emergencyBookingSurcharge Decimal @default(0.5)
  // Integration
  calendarSync             Boolean  @default(false)
  webhookUrl               String?
  apiAccessEnabled         Boolean  @default(false)
  // Meta
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  updatedBy                String?
  // Relations
  steps                    BookingStepConfig[]
  businessHoursConfig      BusinessHoursConfig[]
  paymentMethods           PaymentMethodConfig[]
  notificationTemplates    NotificationTemplate[]
}

model BookingStepConfig {
  id                 String  @id @default(cuid())
  bookingSettingsId  String
  stepName           String
  stepOrder          Int
  enabled            Boolean @default(true)
  required           Boolean @default(true)
  title              String
  description        String?
  validationRules    Json?
  customFields       Json?
  createdAt          DateTime @default(now())

  settings BookingSettings @relation(fields: [bookingSettingsId], references: [id], onDelete: Cascade)

  @@index([bookingSettingsId, stepOrder])
}

model BusinessHoursConfig {
  id                 String  @id @default(cuid())
  bookingSettingsId  String
  dayOfWeek          Int     // 0-6
  isWorkingDay       Boolean @default(true)
  startTime          String?
  endTime            String?
  breakStartTime     String?
  breakEndTime       String?
  maxBookingsPerHour Int     @default(4)

  settings BookingSettings @relation(fields: [bookingSettingsId], references: [id], onDelete: Cascade)

  @@index([bookingSettingsId, dayOfWeek])
}

model PaymentMethodConfig {
  id                 String  @id @default(cuid())
  bookingSettingsId  String
  methodType         String
  enabled            Boolean @default(true)
  displayName        String
  description        String?
  processingFee      Decimal @default(0.0)
  minAmount          Decimal @default(0.0)
  maxAmount          Decimal?
  gatewayConfig      Json?

  settings BookingSettings @relation(fields: [bookingSettingsId], references: [id], onDelete: Cascade)

  @@unique([bookingSettingsId, methodType])
}

model NotificationTemplate {
  id                 String  @id @default(cuid())
  bookingSettingsId  String
  templateType       String
  channel            String
  enabled            Boolean @default(true)
  subject            String?
  content            String   @db.Text
  variables          Json?

  settings BookingSettings @relation(fields: [bookingSettingsId], references: [id], onDelete: Cascade)

  @@index([bookingSettingsId, templateType])
}

model AuditLog {
  id             String   @id @default(cuid())
  userId         String?
  organizationId String?
  action         String
  resource       String
  details        Json?
  ipAddress      String?
  userAgent      String?
  timestamp      DateTime @default(now())

  @@index([organizationId, timestamp])
}
```

Migration checklist:
- Add models above.
- Run `pnpm db:generate` then `pnpm db:push` (or proper migrations if using `migrate dev/deploy`).
- Confirm via `prisma studio` that tables are created.


## 2) Types

Create `src/types/booking-settings.types.ts` with the strongly-typed interfaces and unions for settings, step config, business hours, payment methods, and import/export payloads. Align names/fields with Prisma models.


## 3) Service Layer

Add `src/services/booking-settings.service.ts`:
- getBookingSettings(orgId)
- createDefaultSettings(orgId)
- updateBookingSettings(orgId, updates)
- updateBookingSteps(settingsId, steps)
- updateBusinessHours(settingsId, hours)
- updatePaymentMethods(settingsId, methods)
- validateSettingsUpdate(orgId, updates) with comprehensive business rules
- exportSettings(orgId) / importSettings(orgId, data)
- resetToDefaults(orgId)
- emit settings change event (console stub OK initially)
- wrap multi-table operations in transactions


## 4) API Endpoints (Next.js App Router)

Create routes under `src/app/api/admin/booking-settings/`:
- `route.ts` GET/PUT (fetch/update settings)
- `steps/route.ts` PUT
- `business-hours/route.ts` PUT
- `payment-methods/route.ts` PUT
- `export/route.ts` GET
- `import/route.ts` POST
- `reset/route.ts` POST
- `validate/route.ts` POST

All endpoints:
- Use `getServerSession(authOptions)`
- Enforce RBAC with `hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_*)`
- Resolve `organizationId` from session (consistent with current app user model)
- Audit every change using `prisma.auditLog.create(...)` (non-blocking on failure)


## 5) RBAC

Update `src/lib/permissions.ts`:
- Add keys: `BOOKING_SETTINGS_VIEW`, `BOOKING_SETTINGS_EDIT`, `BOOKING_SETTINGS_EXPORT`, `BOOKING_SETTINGS_IMPORT`, `BOOKING_SETTINGS_RESET`.
- Map them to ADMIN (and TEAM_LEAD where appropriate) in `ROLE_PERMISSIONS`.
- Reuse existing `hasPermission` helpers.


## 6) UI — Admin Panel

- Component: `src/components/admin/BookingSettingsPanel.tsx` (from temp design, adapted to house style).
- Page: `src/app/admin/settings/booking/page.tsx`:
  - Server component: verify session + role; render client component gated with `PermissionGate`.
  - Use existing UI primitives (`src/components/ui/*`) to keep styling consistent.
- Features:
  - Tabs: General, Payments, Steps, Availability, Notifications, Customer, Assignments, Pricing
  - Local change tracking; Save, Reset, Export actions
  - Error/warning rendering from `validate` endpoint


## 7) Caching & Defaults

- Use/reuse `src/lib/cache.service.ts` or `src/lib/cache/*` to cache resolved settings by `organizationId` with short TTL (e.g., 5m).
- Invalidate on successful updates/import/reset.
- On GET, auto-create default settings if none exist.


## 8) Testing (Vitest)

- Service unit tests: validation, CRUD, import/export, reset.
- API integration tests: auth, RBAC, happy-path, validation errors.
- Component tests: rendering tabs, toggling, save flow, export, reset.
- Use Vitest + existing test setup (`vitest.setup.ts`), not Jest.


## 9) Netlify & Ops

- Ensure `NETLIFY_DATABASE_URL` present (already used in Prisma datasource).
- Verify Next.js app functions build via `@netlify/plugin-nextjs` and `netlify.toml`.
- No extra Netlify Functions required; endpoints live under Next API routes.


## 10) Rollout Plan

1) Land Prisma models + migrate
2) Add types + service
3) Wire API routes
4) Add RBAC keys
5) Build UI + page route
6) Add caching + invalidation
7) Add tests (service, API, UI)
8) Manual QA in admin
9) Deploy via Netlify


## Actionable Checklist

- [ ] Prisma models added and migrated
- [ ] Types file created and exported
- [ ] Service implemented with transactions and validation
- [ ] API routes created with RBAC + audit logs
- [ ] Permissions extended and mapped
- [ ] UI component and admin page added
- [ ] Caching/invalidation implemented
- [ ] Vitest tests for service/API/UI passing
- [ ] Netlify envs verified; build succeeds
- [ ] Documentation updated (this file) with status
