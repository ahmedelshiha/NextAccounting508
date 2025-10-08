import { Pool } from 'pg'

function getDbUrl(): string {
  const raw = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!raw) throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
  return raw.replace(/^neon:\/\//, 'postgresql://')
}

async function main() {
  const url = getDbUrl()
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } as any })
  try {
    console.log('🔧 Connecting to database...')
    const client = await pool.connect()
    try {
      console.log('🌱 Seeding superAdmin defaults for security_settings...')
      const res = await client.query(`
        UPDATE public.security_settings AS s
        SET "superAdmin" = jsonb_build_object(
          'stepUpMfa', COALESCE((s."superAdmin"->>'stepUpMfa')::boolean, false),
          'logAdminAccess', COALESCE((s."superAdmin"->>'logAdminAccess')::boolean, true)
        )
        WHERE s."superAdmin" IS NULL
           OR NOT (s."superAdmin" ? 'stepUpMfa')
           OR NOT (s."superAdmin" ? 'logAdminAccess')
      `)
      console.log(`✅ Updated ${res.rowCount ?? 0} row(s) with defaults`)
    } catch (e) {
      console.error('❌ Failed to seed defaults:', (e as any)?.message)
      process.exitCode = 1
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  console.error('Unhandled error:', e)
  process.exit(1)
})
