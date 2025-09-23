import { Client } from 'pg'

async function main() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
  if (!url) {
    console.log('[prisma-init] DATABASE_URL/NETLIFY_DATABASE_URL not set. Skipping init.')
    return
  }

  // Prisma logs show schema "public"; allow override via POSTGRES_SCHEMA
  const targetSchema = process.env.POSTGRES_SCHEMA || 'public'

  const client = new Client({ connectionString: url })
  try {
    await client.connect()

    // Ensure target schema exists and is selected
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}";`)
    await client.query(`SET search_path TO "${targetSchema}";`)

    // Check for existing prisma migration tables in the target schema
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = $1
           AND table_name IN ('_prisma_migrations', 'prisma_migrations')
       ) AS exists;`,
      [targetSchema]
    )

    if (rows[0]?.exists) {
      console.log('[prisma-init] Migration persistence already initialized.')
      return
    }

    console.log(`[prisma-init] Initializing migration persistence table _prisma_migrations in schema "${targetSchema}"...`)

    // Create the _prisma_migrations table following Prisma's expected shape
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${targetSchema}"."_prisma_migrations" (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        finished_at TIMESTAMP(3),
        migration_name TEXT NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMP(3),
        started_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "_prisma_migrations_migration_name_key" ON "${targetSchema}"."_prisma_migrations" (migration_name);
    `)

    console.log('[prisma-init] Migration persistence initialized.')
  } catch (err) {
    console.error('[prisma-init] Error initializing migration persistence:', err)
    // Do not fail hard here; let prisma migrate attempt and surface a clearer error
  } finally {
    await client.end().catch(() => {})
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(0))
