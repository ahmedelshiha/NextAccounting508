/*
Checks that tenantId columns exist in critical tables. Used in CI pre-check to verify migrations applied.
Usage:
  DATABASE_URL=postgres://... node scripts/check_prisma_tenant_columns.js
Exits 0 if all expected columns exist; non-zero otherwise.
*/

 
const { Client } = require('pg')

const expected = [
  { table: 'services', column: 'tenantId' },
  { table: 'ServiceRequest', column: 'tenantId' },
  { table: 'Attachment', column: 'tenantId' },
]

async function main(){
  const conn = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
  if (!conn) {
    console.error('DATABASE_URL or NETLIFY_DATABASE_URL must be set')
    process.exit(2)
  }
  const client = new Client({ connectionString: conn })
  try {
    await client.connect()
    let allOk = true
    for (const e of expected) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [e.table, e.column]
      )
      const exists = res.rows.length > 0
      console.log(`${e.table}.${e.column}: ${exists ? 'OK' : 'MISSING'}`)
      if (!exists) allOk = false
    }
    await client.end()
    if (!allOk) process.exit(5)
    console.log('All tenant columns present')
    process.exit(0)
  } catch (err) {
    console.error('Error checking DB:', err.message || err)
    try { await client.end() } catch {}
    process.exit(3)
  }
}

main()
