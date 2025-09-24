## 2025-09-28 – Analytics chart wrappers
- Added RevenueTrendChart (src/components/dashboard/analytics/RevenueTrendChart.tsx) to render monthly revenue trends with optional target overlay.
- Added BookingFunnelChart (src/components/dashboard/analytics/BookingFunnelChart.tsx) to visualize service booking distribution as a horizontal bar chart.
- Updated BusinessIntelligence to compose the new chart wrappers and use server analytics when available, falling back to dashboard props.
- Why: separate chart concerns into focused, reusable components so other pages can consume them and tests can target small units.
- Next: create RevenueTrendChart unit tests and add a BookingFunnel export preview for large datasets.

