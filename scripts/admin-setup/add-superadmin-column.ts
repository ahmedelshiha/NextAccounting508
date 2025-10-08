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
      console.log('🛠️  Adding superAdmin column to security_settings if missing...')
      await client.query('BEGIN')
      await client.query('ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS "superAdmin" jsonb')
      await client.query('COMMIT')
      console.log('✅ Column ensured: security_settings.superAdmin')
    } catch (e) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to alter table:', (e as any)?.message)
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
