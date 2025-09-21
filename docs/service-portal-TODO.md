

---
Status notes:
- Implemented: core availability generation, pricing API, recurrence preview/creation, conflict detection (service‑level), SSE realtime updates, ICS in confirmations, portal service-requests integration.
- Completed now: team-member-aware availability (uses TeamMember.workingHours, bookingBuffer and maxConcurrentBookings; falls back to service businessHours). This enhances per-member availability filtering and capacity controls.
- Remaining: emergency flow, AvailabilitySlot persistence, auto‑assign on portal create, scheduled reminder persistence, WS endpoint, payment capture, offline queue.


For the next task I will implement AvailabilitySlot persistence and admin endpoints.
