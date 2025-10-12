# Admin Dashboard Release Cadence (10 Weeks)

This plan aligns with the modernization phases referenced in docs/NextAccounting Admin Dashboard Moderniza.md and adheres to success metrics in docs/NextAccounting Admin Dashboard.md.

## Phases & Timeline
- Weeks 1–2: Foundation & Cleanup
  - Deliverables: registry consolidation, layout store unification, CI green, lint/typecheck health.
  - Checkpoint demo at end of week 2.
- Weeks 3–6: Experience Modernization
  - Deliverables: sidebar accessibility/keyboard flows, search, breadcrumbs parity, settings shell UX improvements, high-traffic pages polish.
  - Demos at end of weeks 4 and 6.
- Weeks 7–8: Personalization & Productivity
  - Deliverables: role-based defaults, saved views, quick actions, keyboard shortcuts.
  - Demo at end of week 8.
- Weeks 9–10: Hardening & Performance
  - Deliverables: Lighthouse ≥90 across PWA categories, bundle -20% vs baseline, error budget within SLOs, a11y fixes to WCAG 2.1 AA.
  - Final demo and ship-readiness review at end of week 10.

## Cadence & Ceremonies
- Weekly planning (Mon): status review, risk register, scope changes.
- Mid-week sync (Wed): blockers, cross-team decisions.
- Weekly demo (Fri): phase-specific checkpoint; record Loom and attach to PR/issue.

## Release Criteria (per milestone)
- Tests: unit, integration, e2e passing on main.
- Performance: P95 page TTFB within target; bundle diff ≤ threshold; no critical regressions.
- Security: semgrep scan clean; no high-severity vulns.
- Accessibility: automated checks passing; manual spot checks for critical flows.

## Risk Controls
- Feature flags for new UX (env-based + server-evaluated where possible).
- Dependency freeze windows during release week (Thu–Mon) with hotfix-only policy.
- Rollback preparedness: see docs/rollback-strategy.md.
