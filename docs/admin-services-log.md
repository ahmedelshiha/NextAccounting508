

## [2025-09-23] Phase 2.3 – Analytics enhancements
What I changed:
- Implemented booking-driven analytics in ServicesService.getServiceStats:
  - monthlyBookings: counts per month for the last 6 months
  - revenueByService: top services by revenue (last 6 months)
  - popularServices: ranked by booking count
  - conversionRates: completion/total bookings per recent months
  - revenueTimeSeries: per-service monthly revenue series for top services (last 6 months)
- Ensured tenant scoping is applied to booking queries so analytics are tenant-isolated.

Why:
- Provide richer, time-series analytics for admin dashboards and to enable charts that show trends and revenue per service over time.

Next steps:
- Integrate application traffic/view metrics to compute views→bookings conversion.
- Surface revenueTimeSeries in admin analytics UI (charts) and add unit tests for analytics math.
