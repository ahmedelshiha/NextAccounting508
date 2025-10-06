# Runbook: Seed Tenant Defaults (Netlify Function)

This function seeds OrganizationSettings and SecuritySettings for a given tenant, idempotently.

Endpoint
- Path: /.netlify/functions/seed-tenant-defaults
- Method: POST
- Auth: Header X-SEED-SECRET must equal SEED_TENANT_SECRET environment variable

Environment Variables
- SEED_TENANT_SECRET: Shared secret for authorization
- DATABASE_URL or NETLIFY_DATABASE_URL: Postgres connection string (neon:// supported; auto-normalized)

Request Headers
- Content-Type: application/json
- X-SEED-SECRET: <your secret>

Request Body (JSON)
{
  "tenantId": "t-abc123",           // required
  "tenantSlug": "acme",            // optional, used as fallback org name
  "organizationName": "Acme Corp"  // optional
}

Responses
- 200 OK: { ok: true, tenantId }
- 400 Bad Request: missing fields
- 401 Unauthorized: secret missing/invalid
- 404 Not Found: tenant does not exist
- 500 Internal Server Error: DB/config issues

Example cURL
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-SEED-SECRET: $SEED_TENANT_SECRET" \
  -d '{"tenantId":"t-abc123","tenantSlug":"acme","organizationName":"Acme Corp"}' \
  https://<your-site>.netlify.app/.netlify/functions/seed-tenant-defaults

Notes
- The function is idempotent: it only inserts records if missing.
- SecuritySettings defaults enforce sane password policy; adjust via app UI after seeding.
- Log and monitor via Netlify function logs.
