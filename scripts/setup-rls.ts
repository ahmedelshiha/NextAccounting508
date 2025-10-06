#!/usr/bin/env tsx
import { Client } from 'pg'

function normalizeUrl(url: string | undefined | null) {
  let dbUrl = url || ''
  if (dbUrl && dbUrl.startsWith('neon://')) dbUrl = dbUrl.replace('neon://', 'postgresql://')
  return dbUrl
}

async function main() {
  const url = normalizeUrl(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
  if (!url) {
    console.error('DATABASE_URL/NETLIFY_DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    // Discover tables containing a tenantId column in non-system schemas
    const { rows } = await client.query<{ table_schema: string; table_name: string }>(
      `SELECT table_schema, table_name
       FROM information_schema.columns
       WHERE column_name = 'tenantId'
         AND table_schema NOT IN ('pg_catalog','information_schema')
       ORDER BY table_schema, table_name`
    )

    if (!rows.length) {
      console.log('No tables with tenantId found; nothing to do.')
      return
    }

    // Ensure extension for good measure (optional; safe if exists)
    // await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)

    const allowNull = String(process.env.RLS_ALLOW_NULL_TENANT ?? 'true').toLowerCase() !== 'false'

    for (const { table_schema, table_name } of rows) {
      const fq = `"${table_schema}"."${table_name}"`
      console.log(`Configuring RLS for ${fq}`)

      // Enable RLS (idempotent)
      await client.query(`ALTER TABLE ${fq} ENABLE ROW LEVEL SECURITY`)

      // Create/Replace policy enforcing tenant isolation.
      // Allow rows with NULL tenantId for global rows until Phase 2 enforces NOT NULL.
      // When Phase 2 completes, re-run this script to tighten policy if desired.
      await client.query(`DROP POLICY IF EXISTS rls_tenant_isolation ON ${fq}`)
      const policySQL = allowNull
        ? `CREATE POLICY rls_tenant_isolation ON ${fq}
           USING ("tenantId" = current_setting('app.current_tenant_id', true) OR "tenantId" IS NULL)
           WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true) OR "tenantId" IS NULL)`
        : `CREATE POLICY rls_tenant_isolation ON ${fq}
           USING ("tenantId" = current_setting('app.current_tenant_id', true))
           WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true))`

      await client.query(policySQL)

      // Optionally force RLS to apply to table owners too, controlled via env FORCE_RLS=true
      if (String(process.env.FORCE_RLS || '').toLowerCase() === 'true') {
        await client.query(`ALTER TABLE ${fq} FORCE ROW LEVEL SECURITY`)
      }
    }

    console.log('RLS setup completed for tables with tenantId column.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Failed to setup RLS:', err)
  process.exit(1)
})
