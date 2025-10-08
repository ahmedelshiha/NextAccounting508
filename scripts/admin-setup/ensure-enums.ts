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
    // Add value to UserRole enum if missing
    await client.query('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = $1 AND e.enumlabel = $2) THEN EXECUTE format(''ALTER TYPE %I ADD VALUE %L'', $1, $2); END IF; END $$;', ['UserRole', 'SUPER_ADMIN'])
    console.log('✅ Ensured enum UserRole contains SUPER_ADMIN')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('Failed to ensure enums:', e)
  process.exit(1)
})