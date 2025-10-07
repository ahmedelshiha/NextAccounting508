const { Client } = require('pg')
;(async () => {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) { console.error('DB URL missing'); process.exit(2) }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const tenantRes = await client.query(`SELECT id FROM public."Tenant" ORDER BY "createdAt" LIMIT 1`)
    if (!tenantRes.rows.length) { console.error('No Tenant found to assign'); process.exit(1) }
    const defaultTenant = tenantRes.rows[0].id
    console.log('Default tenant id:', defaultTenant)
    const upd = await client.query(`UPDATE public.services SET "tenantId" = $1 WHERE "tenantId" IS NULL`, [defaultTenant])
    console.log('Updated services rows:', upd.rowCount)
    const check = await client.query(`SELECT COUNT(*)::text AS nulls FROM public.services WHERE "tenantId" IS NULL`)
    console.log('Remaining nulls in services:', check.rows[0].nulls)
  } catch (err) {
    console.error('Error backfilling services tenantId:', err)
    process.exit(1)
  } finally {
    await client.end().catch(()=>{})
  }
})().catch(e=>{console.error(e);process.exit(1)})
