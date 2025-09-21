# Service Portal Booking TODOs (Audit vs docs/booking_enhancement_plan.md)

This list captures missing or partial items to align the booking module with the enhancement plan.

## Foundation & Data Model
- [ ] AvailabilitySlot model usage
  - Persist and consume AvailabilitySlot for manual overrides, capacity and exceptions
  - Admin APIs + UI to create/update/delete slots; support reasons (maintenance/holiday)
- [ ] Team member working hours/timezone
  - Store and honor TeamMember.workingHours and timeZone in availability/conflicts
  - Respect maxConcurrentBookings and bookingBuffer at member level

## Availability & Scheduling
- [ ] Team-member-aware availability
  - When a team member is chosen, compute slots using that member’s workingHours, buffer and time zone
  - Fallback to service.businessHours if member data missing
- [ ] Capacity and blackout controls
  - Enforce service.blackoutDates at API boundary (return 404 for fully blacked-out dates)
  - Respect AvailabilitySlot.maxBookings/currentBookings when present
- [ ] Daily caps per team/service
  - Extend conflict detection for per-team/day capacity

## Booking Wizard (Multi-step)
- [ ] Emergency booking flow
  - UI to set bookingType=EMERGENCY with minAdvance bypass rules and surcharge
  - Server validation + pricing integration
- [ ] Service customization step
  - Configurable add‑ons/variants that affect duration and price
  - Include in payload and pricing breakdown
- [ ] Team member integration
  - When user selects a member, availability/pricing should reflect that selection

## Pricing Engine
- [ ] Enrich dynamic pricing inputs
  - Use service.standardDuration/basePrice consistently; consider hourlyRate when present
  - Add emergency surcharge logic (configurable) and expose via /api/pricing
  - Ensure promo handling supports per‑service rules/extensibility

## Notifications & Reminders
- [ ] Scheduled reminders persistence
  - Create scheduled reminders (DB table) based on BookingPreferences.reminderHours
  - Cron to dispatch and mark sent; support EMAIL and optional SMS
- [ ] Client preferences UI
  - Portal UI for /api/portal/settings/booking-preferences (read/write)

## Real-time & Realtime API
- [ ] Booking WebSocket endpoint
  - Provide /api/ws/bookings (WS) with auth + channel subscriptions; retain SSE fallback
  - Client hook for subscribing to availability and assignment updates

## Payments
- [ ] Payment gateway integration
  - Implement Stripe (or provider) in PaymentStep with server intents and webhook verification
  - Reflect paid/unpaid status on ServiceRequest/Booking and handle failures

## Offline & PWA
- [ ] Offline booking cache and queue
  - IndexedDB cache for services and user bookings; queue pending bookings for retry
  - Extend SW to cache /api/bookings, /api/services and replay queued requests
- [ ] Manifest alignment
  - Consider aligning to /manifest.json or ensure manifest.webmanifest provides required shortcuts/icons

## Admin Tooling
- [ ] Admin management of business hours & blackout dates
  - UI + API to configure Service and TeamMember hours, buffer, blackoutDates
  - Seed sensible defaults; audit logs on changes

## Conflict Detection
- [ ] Member-aware rules
  - Include TeamMember bookingBuffer and capacity in checks
  - Improve messages (double‑booking, buffer violation, daily cap) for UI consumption

## Testing & Quality
- [ ] Unit tests & integration tests
  - Availability generation (service vs team member)
  - Pricing (weekend/peak/emergency/promo/FX)
  - Recurring plan and conflict detection
  - API contracts for availability, pricing, bookings

## Optional Enhancements
- [ ] ICS improvements
  - Add location/timezone awareness and richer description lines
- [ ] Live chat on booking page
  - Mount existing LiveChatWidget/console for quick help during booking

---
Status notes:
- Implemented: core availability generation, pricing API, recurrence preview/creation, conflict detection (service‑level), SSE realtime updates, ICS in confirmations, portal service-requests integration.
- Missing/Partial: team‑member working hours/timezone, AvailabilitySlot persistence, emergency flow, auto‑assign on portal create, scheduled reminder persistence, WS endpoint, payment capture, offline queue.
