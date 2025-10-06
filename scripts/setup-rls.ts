#!/usr/bin/env tsx
import { Client } from 'pg'
import { pathToFileURL } from 'url'

export type SetupTenantRLSOptions = {
  databaseUrl?: string | null
  allowNullTenant?: boolean
  forceRls?: boolean
  verbose?: boolean
}

export function normalizeDatabaseUrl(url: string | undefined | null): string {
  let dbUrl = url || ''
  if (dbUrl && dbUrl.startsWith('neon://')) dbUrl = dbUrl.replace('neon://', 'postgresql://')
  return dbUrl
}

export async function setupTenantRLS(options: SetupTenantRLSOptions = {}): Promise<void> {
  const url = normalizeDatabaseUrl(
    options.databaseUrl ?? process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL
  )
  if (!url) {
    throw new Error('DATABASE_URL/NETLIFY_DATABASE_URL not set')
  }

  const allowNull =
    options.allowNullTenant ?? String(process.env.RLS_ALLOW_NULL_TENANT ?? 'true').toLowerCase() !== 'false'
  const forceRls =
    options.forceRls ?? String(process.env.FORCE_RLS || '').toLowerCase() === 'true'
  const verbose = options.verbose ?? true

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    const { rows } = await client.query<{ table_schema: string; table_name: string }>(
      `SELECT table_schema, table_name
       FROM information_schema.columns
       WHERE column_name = 'tenantId'
         AND table_schema NOT IN ('pg_catalog','information_schema')
       ORDER BY table_schema, table_name`
    )

    if (!rows.length) {
      if (verbose) console.log('No tables with tenantId found; nothing to do.')
      return
    }

    for (const { table_schema, table_name } of rows) {
      const fq = `"${table_schema}"."${table_name}"`
      if (verbose) console.log(`Configuring RLS for ${fq}`)

      await client.query(`ALTER TABLE ${fq} ENABLE ROW LEVEL SECURITY`)

      await client.query(`DROP POLICY IF EXISTS rls_tenant_isolation ON ${fq}`)
      const policySQL = allowNull
        ? `CREATE POLICY rls_tenant_isolation ON ${fq}
           USING ("tenantId" = current_setting('app.current_tenant_id', true) OR "tenantId" IS NULL)
           WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true) OR "tenantId" IS NULL)`
        : `CREATE POLICY rls_tenant_isolation ON ${fq}
           USING ("tenantId" = current_setting('app.current_tenant_id', true))
           WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true))`

      await client.query(policySQL)

      if (forceRls) {
        await client.query(`ALTER TABLE ${fq} FORCE ROW LEVEL SECURITY`)
      }
    }

    if (verbose) console.log('RLS setup completed for tables with tenantId column.')
  } finally {
    await client.end()
  }
}

if (process.argv[1]) {
  const executedDirectly = import.meta.url === pathToFileURL(process.argv[1]).href
  if (executedDirectly) {
    setupTenantRLS()
      .catch((err) => {
        console.error('Failed to setup RLS:', err)
        process.exit(1)
      })
      .then(() => {
        process.exit(0)
      })
  }
}
