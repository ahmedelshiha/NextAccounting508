# Admin Performance Metrics Report

Date: 2025-09-24

Scope: Compare route load and interaction timings before/after AdvancedDataTable rollout. Instrumentation via PerfMetricsReporter (client) posting to /api/admin/perf-metrics; snapshot aggregates available via GET.

Current Snapshot (from /api/admin/perf-metrics GET):
- Page Load (s): current 1.2, previous 1.8, trend up
- API Response (ms): current 245, previous 310, trend up
- Uptime (%): current 99.8, previous 99.2, trend up
- Error Rate (%): current 0.02, previous 0.08, trend up

Recent Client Samples: View live at /admin/perf-metrics. Table includes per-path LCP, CLS, INP, TTFB, FCP, DOM Interactive, Load.

Methodology:
- Navigate target routes (/admin/bookings, /admin/services, /admin/service-requests) and perform common interactions.
- Observe LCP/CLS/INP and navigation timings; take two snapshots: PRE-change and POST-change windows (15–30 samples each).
- Record any regression thresholds: LCP +10% or CLS > 0.1 triggers investigation.

Conclusion:
- Baseline snapshot indicates improved page load vs previous aggregate. Continue monitoring after deployment; append post-change measurements below.

Post-Change Measurements:
- To be appended after deployment window using /admin/perf-metrics viewer.
