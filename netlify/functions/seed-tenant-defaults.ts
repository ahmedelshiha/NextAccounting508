import { Handler } from '@netlify/functions'
import { Client } from 'pg'

function normalizeUrl(url: string | undefined | null) {
  let dbUrl = url || ''
  if (dbUrl && dbUrl.startsWith('neon://')) dbUrl = dbUrl.replace('neon://', 'postgresql://')
  return dbUrl
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }

    const secret = process.env.SEED_TENANT_SECRET
    const incoming = event.headers['x-seed-secret'] || event.headers['X-SEED-SECRET']
    if (!secret || !incoming || incoming !== secret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const payload = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body as any)
    const tenantId: string | undefined = payload?.tenantId
    const tenantSlug: string | undefined = payload?.tenantSlug
    const orgName: string | undefined = payload?.organizationName

    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'tenantId is required' }) }
    }

    const databaseUrl = normalizeUrl(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL)
    if (!databaseUrl) {
      return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) }
    }

    const client = new Client({ connectionString: databaseUrl })
    await client.connect()

    try {
      // Verify tenant exists
      const tenantRes = await client.query(`SELECT id FROM "Tenant" WHERE id = $1`, [tenantId])
      if (!tenantRes.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Tenant not found' }) }
      }

      // Seed OrganizationSettings if missing
      await client.query(
        `INSERT INTO public.organization_settings (
          id, "tenantId", name, "createdAt", "updatedAt"
        )
        SELECT gen_random_uuid(), $1, COALESCE($2, 'New Organization'), now(), now()
        WHERE NOT EXISTS (
          SELECT 1 FROM public.organization_settings WHERE "tenantId" = $1
        )`,
        [tenantId, orgName || tenantSlug || null]
      )

      // Seed SecuritySettings if missing
      await client.query(
        `INSERT INTO public.security_settings (
          id, "tenantId", "passwordPolicy", "sessionSecurity", "twoFactor", "network", "dataProtection", "compliance", "createdAt", "updatedAt"
        )
        SELECT gen_random_uuid(), $1,
               jsonb_build_object('minLength', 12, 'requireUppercase', true, 'requireLowercase', true, 'requireNumber', true, 'requireSymbol', false, 'rotationDays', 0),
               jsonb_build_object('idleTimeoutMinutes', 30, 'maxSessionDays', 30),
               jsonb_build_object('enabled', false),
               jsonb_build_object(),
               jsonb_build_object('retentionYears', 7),
               jsonb_build_object('policies', []),
               now(), now()
        WHERE NOT EXISTS (
          SELECT 1 FROM public.security_settings WHERE "tenantId" = $1
        )`,
        [tenantId]
      )

      await client.end()
      return { statusCode: 200, body: JSON.stringify({ ok: true, tenantId }) }
    } catch (err: any) {
      try { await client.end() } catch {}
      return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
    }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
