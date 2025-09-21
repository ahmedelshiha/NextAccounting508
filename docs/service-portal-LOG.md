2025-09-21  — Team-member-aware availability implemented

Summary:
- Implemented support for TeamMember working hours and booking parameters in availability calculation.
- Updated src/lib/booking/availability.ts to prefer TeamMember.workingHours, bookingBuffer and maxConcurrentBookings when teamMemberId is provided by the availability API. Falls back to service businessHours when member settings are absent.

Why:
- This aligns availability generation with the enhancement plan (docs/booking_enhancement_plan.md) and allows users to request specific team members while accurately reflecting their schedule and capacity.

Files changed:
- src/lib/booking/availability.ts — enhanced getAvailabilityForService to load team member settings and apply them to generateAvailability
- docs/service-portal-TODO.md — updated status and notes

Next steps:
- Implement AvailabilitySlot persistence and admin APIs/UI to manage manual overrides, blackout dates, and per-slot capacities.
- Extend conflict detection to incorporate member-level capacities and explicit AvailabilitySlot reservations.
- Add unit tests covering member-aware availability generation.

Logged by: Autonomous Dev (assistant)
