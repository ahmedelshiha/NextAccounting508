This folder documents Phase 1 Data Model Unification (Bookings in ServiceRequest).
Apply via CI: pnpm prisma generate && pnpm prisma migrate deploy
Includes schema changes in prisma/schema.prisma adding:
- ServiceRequest booking fields (isBooking, scheduledAt, duration, clientName, clientEmail, clientPhone, confirmed, reminderSent, bookingType, recurringPattern, parentBookingId) and indexes
- Service booking fields (bookingEnabled, advanceBookingDays, minAdvanceHours, maxDailyBookings, bufferTime, businessHours, blackoutDates) and indexes
- TeamMember booking fields (timeZone, maxConcurrentBookings, bookingBuffer, autoAssign) and indexes
- AvailabilitySlot model
- BookingPreferences model
