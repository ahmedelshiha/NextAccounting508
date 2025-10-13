#!/usr/bin/env tsx
/*
  Staging DB migration verification
  - Verifies connectivity
  - Ensures critical tables exist
  - Ensures important unique index exists
  - Reports and exits non-zero on failure
*/
import prisma from '../../src/lib/prisma'

function log(msg: string) { console.log(`[verify-db] ${msg}`) }
function fail(msg: string): never { console.error(`[verify-db] ERROR: ${msg}`); process.exit(1) }

async function querySingle<T = any>(sql: string): Promise<T[]> {
  // Use Unsafe to allow identifiers with quotes
  return prisma.$queryRawUnsafe<T[]>(sql)
}

async function assertConnected() {
  log('Checking DB connectivity...')
  try {
    await querySingle('SELECT 1')
    log('Connectivity OK')
  } catch (e: any) {
    fail(`Cannot connect to database: ${e?.message || e}`)
  }
}

async function assertTableExists(table: string) {
  const ident = `public."${table}"`
  const rows = await querySingle<{ exists: boolean }>(`SELECT to_regclass('${ident}') IS NOT NULL AS exists`)
  if (!rows?.[0]?.exists) fail(`Missing table: ${table}`)
  log(`Table present: ${table}`)
}

async function assertFavoriteUniqueIndex() {
  // Ensure unique index/constraint on (tenantId,userId,settingKey)
  const rows = await querySingle<{ indexname: string, indexdef: string }>(
    `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='favorite_settings'`
  )
  const defs = (rows || []).map(r => r.indexdef.replace(/\"/g, '"').toLowerCase())
  const hasTriple = defs.some(def => def.includes('(tenantid, userid, settingkey)') || def.includes('unique') && def.includes('tenantid') && def.includes('userid') && def.includes('settingkey'))
  if (!hasTriple) fail('Missing unique index/constraint on favorite_settings(tenantId,userId,settingKey)')
  log('Unique index present on favorite_settings(tenantId,userId,settingKey)')
}

async function main() {
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!url) fail('DATABASE_URL not set. Provide staging DB connection string in env.')

  await assertConnected()

  // Critical tables introduced/used by upgrades
  const tables = [
    'setting_change_diffs',
    'favorite_settings',
    'audit_events',
    'organization_settings',
  ]
  for (const t of tables) {
    await assertTableExists(t)
  }

  await assertFavoriteUniqueIndex()

  log('All checks passed')
  process.exit(0)
}

main().catch((e) => fail(e?.message || String(e)))
