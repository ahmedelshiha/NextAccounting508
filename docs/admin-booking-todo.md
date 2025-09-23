# Admin Booking Settings — Implementation TODO (Next.js + Prisma + Netlify)

Goal: Ship a production-grade Booking Settings module (admin) with RBAC, audit logging, import/export, and a clean UI, leveraging Next.js App Router, Prisma (Postgres on Netlify), and existing project patterns.


## Status Update

- Completed: Created this implementation plan and checklist with dependency ordering and measurable tasks.
- Why: Establish clear scope, reduce risk, and enable predictable delivery across backend, API, and UI.
- Next: Implement Prisma data models and migrate database, then add types and service layer.


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
- [ ] Add models above to `prisma/schema.prisma`.
- [ ] Run `pnpm db:generate`.
- [ ] Run `pnpm db:push` (or `migrate dev/deploy` as appropriate).
- [ ] Open `prisma studio` and confirm tables and indexes exist.


## 2) Types

Create `src/types/booking-settings.types.ts` with strongly-typed interfaces and unions aligned to Prisma models.

- [ ] Define BookingSettings, BookingStepConfig, BusinessHoursConfig, PaymentMethodConfig, NotificationTemplate, and export/import payloads.
- [ ] Export enums/unions (PaymentMethodType, AssignmentStrategy, Notification channels/types, DayOfWeek).
- [ ] Ensure numeric ranges and optionality match database defaults.


## 3) Service Layer

Add `src/services/booking-settings.service.ts` implementing business logic and validation.

- [ ] getBookingSettings(orgId): include steps, business hours, payment methods, notification templates.
- [ ] createDefaultSettings(orgId): seed defaults in a single transaction.
- [ ] updateBookingSettings(orgId, updates): validate, merge sections, update, return hydrated result.
- [ ] updateBookingSteps(settingsId, steps): replace set transactionally by order.
- [ ] updateBusinessHours(settingsId, hours): replace per-day config.
- [ ] updatePaymentMethods(settingsId, methods): upsert by methodType.
- [ ] validateSettingsUpdate(orgId, updates): cross-field rules (e.g., paymentRequired => at least one method enabled; deposit 10–100; min/max windows, etc.).
- [ ] exportSettings(orgId) / importSettings(orgId, data): versioned payloads, selectable sections, overwrite option.
- [ ] resetToDefaults(orgId): delete then recreate defaults.
- [ ] Emit non-blocking settings change event (console stub acceptable initially).


## 4) API Endpoints (Next.js App Router)

Create endpoints under `src/app/api/admin/booking-settings/` with RBAC + audit logging.

- [ ] `route.ts` GET: fetch or create defaults; PUT: validate, update, log action.
- [ ] `steps/route.ts` PUT: replace steps; log action.
- [ ] `business-hours/route.ts` PUT: replace hours; log action.
- [ ] `payment-methods/route.ts` PUT: upsert methods; log action.
- [ ] `export/route.ts` GET: export with version; log action.
- [ ] `import/route.ts` POST: import selected sections; log action.
- [ ] `reset/route.ts` POST: backup id (if available), reset to defaults; log action.
- [ ] `validate/route.ts` POST: return validation result; no mutation.

Endpoint guardrails:
- [ ] Enforce session via `getServerSession(authOptions)`.
- [ ] Use `hasPermission(role, PERMISSIONS.BOOKING_SETTINGS_*)`.
- [ ] Read `organizationId` from session.
- [ ] Wrap audit log writes in try/catch to avoid breaking main flow.


## 5) RBAC

Update `src/lib/permissions.ts` with booking permissions and role mapping.

- [ ] Add: BOOKING_SETTINGS_VIEW, BOOKING_SETTINGS_EDIT, BOOKING_SETTINGS_EXPORT, BOOKING_SETTINGS_IMPORT, BOOKING_SETTINGS_RESET.
- [ ] Map to `ADMIN` (all) and `TEAM_LEAD` (VIEW, EDIT, EXPORT) as needed.
- [ ] Verify usage in all new endpoints.


## 6) UI — Admin Panel

Add Booking Settings UI and page.

- [ ] `src/components/admin/BookingSettingsPanel.tsx`: tabbed UI, local changes, save/reset/export, render server validation errors/warnings.
- [ ] `src/app/admin/settings/booking/page.tsx`: page wrapper; authorize and render panel via `PermissionGate`.
- [ ] Use `src/components/ui/*` primitives; keep existing styles and spacing system.


## 7) Caching & Defaults

Settings retrieval performance and consistency.

- [ ] Cache resolved settings by `organizationId` with short TTL (e.g., 300s) using `src/lib/cache.service.ts`.
- [ ] Invalidate cache on update/import/reset.
- [ ] Auto-create defaults when GET finds none.


## 8) Testing (Vitest)

Comprehensive coverage using existing Vitest setup.

- [ ] Service tests: validation cases, transactions, defaults, import/export, reset.
- [ ] API tests: auth failures, RBAC, happy-path, validation errors, export/import/reset.
- [ ] Component tests: tab rendering, toggles, save flow, export download, reset flow.


## 9) Netlify & Ops

Verify deployability and env setup.

- [ ] Ensure `NETLIFY_DATABASE_URL` and NextAuth envs are set in Netlify settings.
- [ ] Confirm `@netlify/plugin-nextjs` builds API routes in `netlify.toml`.
- [ ] Build pipeline passes lint, typecheck, and build scripts in `package.json`.


## 10) Rollout Plan (dependency-ordered)

- [ ] Prisma models + migration
- [ ] Types file
- [ ] Service layer
- [ ] API routes
- [ ] RBAC keys/mapping
- [ ] UI page + component
- [ ] Caching + invalidation
- [ ] Vitest tests (service/API/UI)
- [ ] Admin QA
- [ ] Netlify deploy
