const { Client } = require('pg')
;(async () => {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) { console.error('DB URL missing'); process.exit(2) }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const id = 'sr_' + Math.random().toString(36).slice(2, 12)
    // replace these values as needed
    const clientId = process.argv[2] || 'cmggf27ul0001rhsr04x7b4jr'
    const serviceId = process.argv[3] || 'cmfwiipw10001k009yidaljav'
    const tenantId = process.argv[4] || (await (await client.query(`SELECT id FROM public."Tenant" ORDER BY "createdAt" LIMIT 1`)).rows[0]).id
    const title = process.argv[5] || 'Smoke test request'
    const description = process.argv[6] || 'Created by smoke test raw SQL'
    const now = new Date().toISOString()
    const res = await client.query(`INSERT INTO public."ServiceRequest" (id, uuid, "clientId", "serviceId", title, description, priority, status, "tenantId", "createdAt", "updatedAt") VALUES ($1, gen_random_uuid()::text, $2, $3, $4, $5, 'MEDIUM', 'SUBMITTED', $6, $7, $7) RETURNING id`, [id, clientId, serviceId, title, description, tenantId, now])
    console.log('Inserted service request id:', res.rows[0].id)
  } catch (e) {
    console.error('Error inserting service request:', e)
    process.exit(1)
  } finally {
    await client.end().catch(()=>{})
  }
})().catch(e=>{console.error(e);process.exit(1)})
