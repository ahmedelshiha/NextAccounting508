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
    const plpgsql = `
      DO $$
      DECLARE
        typename text := 'UserRole';
        label text := 'SUPER_ADMIN';
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = typname AND e.enumlabel = label
        ) THEN
          EXECUTE 'ALTER TYPE ' || quote_ident(typename) || ' ADD VALUE ' || quote_literal(label);
        END IF;
      END
      $$;
    `
    await client.query(plpgsql)
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
