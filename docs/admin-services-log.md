## [2025-09-23] Sentry verification hardening
What I added:
- Enabled Sentry tunnel route (/monitoring) via withSentryConfig and client SDK to avoid ad blockers/CORS issues.
- Added /api/sentry-check endpoint that reports DSN presence (boolean) without exposing secrets.

Why:
- Reports of "Trigger Client/Server Error" not verifying are often due to blocked /envelope requests, missing server DSN, or CORS.

Next steps:
- In Sentry Project Settings → Security → Allowed Domains, add preview/prod domains (*.projects.builder.codes, *.fly.dev, and your production host).
- Re-test at /sentry-example-page; verify /monitoring responses (200) and events appearing in Sentry.


