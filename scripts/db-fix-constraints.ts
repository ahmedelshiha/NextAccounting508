import { Client } from 'pg'

async function run() {
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    console.log('[db-fix] No NETLIFY_DATABASE_URL/DATABASE_URL set. Skipping.')
    return
  }
  const schema = process.env.POSTGRES_SCHEMA || 'public'
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    console.log(`[db-fix] Connected. Schema=${schema}`)

    // Drop unique constraint that blocks Prisma from replacing it
    const dropConstraintSql = `
      DO $$
      DECLARE
        constraint_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          WHERE n.nspname = $1
            AND t.relname = 'BookingPreferences'
            AND c.conname = 'BookingPreferences_userid_key'
        ) INTO constraint_exists;

        IF constraint_exists THEN
          EXECUTE 'ALTER TABLE "' || $1 || '"."BookingPreferences" DROP CONSTRAINT "BookingPreferences_userid_key"';
          RAISE NOTICE '[db-fix] Dropped constraint BookingPreferences_userid_key';
        ELSE
          RAISE NOTICE '[db-fix] Constraint BookingPreferences_userid_key not found; nothing to drop';
        END IF;
      END $$;
    `

    await client.query(dropConstraintSql, [schema])

    // Also drop any legacy index with mismatched name if present
    const dropIndexSql = `
      DO $$
      DECLARE
        idx_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM pg_class i
          JOIN pg_namespace n ON n.oid = i.relnamespace
          WHERE n.nspname = $1 AND i.relname = 'BookingPreferences_userid_key'
        ) INTO idx_exists;

        IF idx_exists THEN
          EXECUTE 'DROP INDEX IF EXISTS "' || $1 || '"."BookingPreferences_userid_key"';
          RAISE NOTICE '[db-fix] Dropped index BookingPreferences_userid_key';
        ELSE
          RAISE NOTICE '[db-fix] Index BookingPreferences_userid_key not found; nothing to drop';
        END IF;
      END $$;
    `

    await client.query(dropIndexSql, [schema])

    console.log('[db-fix] Completed.')
  } catch (err) {
    console.error('[db-fix] Error:', err)
  } finally {
    await client.end().catch(()=>{})
  }
}

run().catch(()=>process.exit(0))
