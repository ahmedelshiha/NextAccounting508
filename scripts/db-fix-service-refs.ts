import { Client } from 'pg'

async function run() {
  const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    console.log('[db-fix-service-refs] No NETLIFY_DATABASE_URL/DATABASE_URL set. Skipping.')
    return
  }
  const schema = (process.env.POSTGRES_SCHEMA || 'public').replace(/"/g, '')
  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    console.log(`[db-fix-service-refs] Connected. Schema=${schema}`)
    const { rows } = await client.query<{ serviceId: string }>(`SELECT DISTINCT "serviceId" FROM "${schema}"."ServiceRequest" WHERE "serviceId" IS NOT NULL`)
    const ids = rows.map(r => r.serviceId).filter(Boolean)
    console.log(`[db-fix-service-refs] Found ${ids.length} distinct serviceIds in ServiceRequest`)

    for (const id of ids) {
      const exists = await client.query(`SELECT 1 FROM "${schema}"."services" WHERE id = $1`, [id])
      if (exists.rowCount && exists.rowCount > 0) continue
      const slug = `migrated-${id.substring(0, 24).replace(/[^a-zA-Z0-9_-]/g,'')}`
      const name = `Migrated ${id.substring(0, 8)}`
      const desc = 'Auto-created during schema migration to satisfy FK from ServiceRequest.'
      await client.query(
        `INSERT INTO "${schema}"."services" (id, name, slug, description, "updatedAt") VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (id) DO NOTHING`,
        [id, name, slug, desc]
      )
      console.log(`[db-fix-service-refs] Inserted service id=${id} slug=${slug}`)
    }

    console.log('[db-fix-service-refs] Completed.')
  } catch (err) {
    console.error('[db-fix-service-refs] Error:', err)
  } finally {
    await client.end().catch(()=>{})
  }
}

run().catch(()=>process.exit(0))
