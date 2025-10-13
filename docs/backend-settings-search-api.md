# Backend Settings Search — Design & API Contract

Purpose
- Support tenant-scoped, server-side search for large deployments where client-side indexing (Fuse) is insufficient.
- Provide paginated, permission-filtered results and support incremental indexing.

API
- Route: GET /api/admin/settings/search
- Query params:
  - q (string) required: search query
  - page (number) optional, default 1
  - perPage (number) optional, default 20, max 100
  - category (string) optional: filter by category key
- Authentication: requires tenant context and user session.
- Response:
  - { ok: true, data: { items: [{ key, label, route, category, score }], total, page, perPage } }

Server-side responsibilities
- Authorization: filter out items not visible to the caller (check permissions; use ROLE_PERMISSIONS)
- Tenant scoping: only return items for the caller's tenant when applicable
- Ranking: use fuzzy matching (pg_trgm) or an external search service (Supabase/Meilisearch/Elasticsearch)
- Caching: short TTL (10s) for repeated queries; invalidate on SETTINGS_REGISTRY changes
- Rate limiting: per-tenant and per-user (e.g. 60/min) to prevent abuse — reuse existing rate-limit helpers (src/lib/rate-limit.ts)

Indexing strategies
- Small deployments: build index dynamically from in-memory SETTINGS_REGISTRY per request
- Large deployments: maintain a materialized search table (settings_search_index) with columns: tenantId, key, label, route, category, tokens, updatedAt
  - Update during deployments/migrations or on registry changes via admin job
  - Use trigram indexes or full-text search depending on DB

Implementation sketch (Next.js app route)
- GET handler:
  1. Require tenant context & user session
  2. Validate q param
  3. Perform rate-limit check
  4. If tenant small/flag set, use in-memory Fuse search; otherwise query DB search table
  5. Filter results by permission
  6. Return paginated results

Data model (if using DB index)
- model SettingsSearchIndex {
    id String @id @default(cuid())
    tenantId String?
    key String
    label String
    route String
    category String
    tokens String[] // optional
    updatedAt DateTime @updatedAt
    @@index([tenantId, key])
    @@index([tenantId, updatedAt])
  }

Operational notes
- Rebuild strategy: run incremental update jobs after deploy; use webhooks from CI if registry changed
- Monitoring: track search latency, error rate, and top queries; hook to Sentry/Monitoring

MCP recommendations
- Supabase: Postgres + pg_trgm or Supabase Search for a simple hosted option. (Connect via MCP)
- Neon: serverless Postgres if you prefer Neon. (Connect via MCP)
- Meilisearch/Elastic: for advanced ranking and scale

Security
- Sanitize query strings to prevent injection
- Enforce permission checks strictly on server
- Log anonymized queries for telemetry only with tenant opt-in


