import { Pool } from 'pg'

function getDbUrl(): string {
  const raw = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!raw) throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
  return raw.replace(/^neon:\/\//, 'postgresql://')
}

async function main() {
  const url = getDbUrl()
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } as any })
  const client = await pool.connect()
  try {
    const exists = await client.query(
      `SELECT COUNT(*)::int AS c
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='security_settings' AND lower(column_name)='superadmin'`
    )
    console.log('Column superAdmin exists count:', exists.rows[0]?.c)

    const rows = await client.query(`SELECT tenantId, "superAdmin" FROM public.security_settings ORDER BY tenantId LIMIT 5`)
    console.log('Sample rows:', JSON.stringify(rows.rows, null, 2))

    const missingDefaults = await client.query(
      `SELECT COUNT(*)::int AS c FROM public.security_settings s
       WHERE s."superAdmin" IS NULL
          OR NOT (s."superAdmin" ? 'stepUpMfa')
          OR NOT (s."superAdmin" ? 'logAdminAccess')`
    )
    console.log('Rows missing defaults:', missingDefaults.rows[0]?.c)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
