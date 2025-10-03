# Professional New Booking Interface

This document describes the admin New Booking experience, data flow, API integration, validation, and extension points.

## Locations
- Page: `src/app/admin/bookings/new/page.tsx`
- API (create/list): `src/app/api/bookings/route.ts`
- Client creation (full form): `src/app/admin/clients/new/page.tsx`
- Smart Actions entry: `src/app/admin/page.tsx` → SmartQuickActions → “New Booking” links to `/admin/bookings/new`

## Overview
A 5-step wizard for admins to schedule client appointments:
1) Client: pick an existing client (search/filter) or navigate to the full client creation page.
2) Service: select a service with category filter, pricing, duration, complexity, and required documents.
3) Schedule: choose date/time (30-day window), assign staff, select location (Office, Remote, Client Site).
4) Details: set priority, source, meeting link or onsite address, special instructions, recurring pattern, preparation flags, notes.
5) Review: verify all entered details and optional service requirements preview.

The interface is responsive, matches the dashboard design, and includes loading/success/error states.

## Data Models (TypeScript)
- Service: `{ id, name, description, category, duration, price, estimatedHours, requirements[], isPopular, complexity }`
- Client: `{ id, name, email, phone?, company?, tier, address?, totalBookings, lastBooking?, preferredTime?, notes?, isActive }`
- Staff: `{ id, name, role, email, specialties[], isAvailable, workingHours: { start, end, days[] } }`
- BookingFormData: fields for client, service, schedule, assignment, logistics, business details, and notes.

## API Integration
- Services: `GET /api/services`
  - Maps DB service to UI Service:
    - `id: s.id`
    - `name: s.name`
    - `description: s.description || s.shortDesc || ''`
    - `category: (s.category || 'consulting').toLowerCase()`
    - `duration: s.duration || 60`
    - `price: s.price || 0`
    - `estimatedHours: max(1, round((duration/60), 1))`
    - `requirements: s.features?.slice(0,5) || ['Government ID','Previous statements']`
    - `isPopular: !!s.featured`
    - `complexity: duration>120→advanced, >60→intermediate, else basic`

- Clients: `GET /api/admin/users`
  - Filters to `role === 'CLIENT'` for selection list.

- Create Booking: `POST /api/bookings`
  - Body example:
  ```json
  {
    "clientId": "<client-id>",
    "serviceId": "<service-id>",
    "scheduledAt": "2025-09-15T10:30:00.000Z",
    "notes": "Internal or client notes",
    "clientName": "Ahmed Hassan",
    "clientEmail": "ahmed@example.com",
    "clientPhone": "+20123456789"
  }
  ```
  - Scheduling combines `scheduledDate` + `scheduledTime` to ISO.

### API Behavior (Server)
- `src/app/api/bookings/route.ts`
  - Auth required. Clients can only create/read their bookings.
  - Admin/Staff can specify `clientId` (server sets `clientId = body.clientId` for ADMIN/STAFF; otherwise uses session user id).
  - Validates service existence and basic conflicts (pending/confirmed overlapping within buffer).
  - Creates booking with duration from service or 60.

## Access Control
- Assumes authenticated admin use in `/admin/bookings/new`.
- Route protection should be enforced by existing auth/middleware.

## Validation & UX
- Step gating:
  - Step 1: existing client selected OR new client creation via dedicated page.
  - Step 2: service selection required.
  - Step 3: date, time, and staff required.
- Form prevents Next until required data is present.
- Loading indicators for initial data fetch and submission.
- Review step consolidates all selections prior to POST.

## Scheduling & Assignment
- 30-day date options.
- 30-minute time slots, 08:00–18:00 by default.
- Staff list filtered to available staff and shows specialties and working hours (currently mocked; see Extensions).

## Locations & Logistics
- Office, Remote (meeting link), Client Site (onsite address) with contextual fields.

## Business Details
- Priority: Normal/High/Urgent
- Source: Direct/Website/Referral/Marketing
- Recurring: Weekly/Monthly/Quarterly
- Preparation: flag + notes
- Internal/Client notes

## Error Handling
- Frontend: inline messages, alerts on failed create, guarded navigation.
- Backend: returns 4xx/5xx structured JSON errors.

## Styling & Accessibility
- Consistent with `Card`, `Button`, `Badge` components.
- Keyboard-friendly selects and buttons.
- Responsive grid layouts.

## Linking to Client Creation
- The “New Client” action navigates to `/admin/clients/new` to use the full, validated client form (`src/app/admin/clients/new/page.tsx`).

## Extensions
- Staff Integration: add `/api/staff` to replace mock staff; include availability checks.
- Calendar: expose booked slots and apply service/staff constraints.
- Notifications: send confirmation emails on successful booking (hook into existing email service).
- Analytics: track conversion, revenue forecasts, and source performance.

## QA Checklist
- Services load when DB available; falls back gracefully.
- Clients list shows only role CLIENT.
- Step gating works and “Next” is disabled until valid.
- Remote/Client Site fields appear only when selected.
- POST /api/bookings creates records and respects admin-provided clientId.
- Review displays correct formatted date/time and badges.

## Known Notes
- Staff list is mocked on the page and should be replaced with a real endpoint when available.
- Server-side double-booking check is basic; enhance to consider staff and room constraints as needed.
