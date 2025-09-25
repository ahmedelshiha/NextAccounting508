# Sentry Setup & Verification

This guide configures Sentry for server and client, uses a secure server-side tunnel endpoint (/api/monitoring), and verifies error capture.

Files added:
- sentry.server.config.ts and sentry.client.config.ts (already present)
- src/app/api/monitoring/route.ts (proxy tunnel)

Environment variables (set in Netlify/Vercel production/staging):
- SENTRY_DSN: the full Sentry DSN (server-side)
- NEXT_PUBLIC_SENTRY_DSN: optional public DSN for client (if using direct client ingestion)
- SENTRY_AUTH_TOKEN: for release/source map upload in CI

Netlify best practices:
- Set SENTRY_DSN and SENTRY_AUTH_TOKEN in Site -> Build & deploy -> Environment.
- Enable the Netlify plugin to run e2e only when RUN_E2E=true (docs/netlify-e2e-plugin.md).
- For source maps/releases: configure a CI job (e.g., GitHub Action) that runs sentry-cli during build and uploads source maps if you use SENTRY_AUTH_TOKEN.

Vercel best practices:
- Add the same env vars in Vercel Project Settings -> Environment Variables for preview and production.
- Use an external runner to upload releases/source maps via SENTRY_AUTH_TOKEN during CI.

How to test the integration locally and in staging:
1. Ensure SENTRY_DSN is set in your environment.
2. Start the app locally.
3. From the browser console run:
   Sentry.captureMessage('Test client message')
   (requires window.Sentry available via client SDK initialization)

4. Or trigger an error in server code and verify it appears in Sentry.

Test helper script (optional):
- scripts/sentry-send-test.js (not included) — you can POST to /api/monitoring with a simple envelope to verify the tunnel.

Notes:
- The monitoring tunnel proxies the envelope to Sentry using the SENTRY_DSN set on the server. This keeps credentials secret while allowing the client to send via /monitoring.
- If the build environment cannot install Playwright browsers or other deps, prefer running E2E on a separate runner and point it to the deployed preview.

