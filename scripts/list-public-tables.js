const { Client } = require('pg')
;(async () => {
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) { console.error('DB URL missing'); process.exit(2) }
  const client = new Client({ connectionString })
  await client.connect()
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
  console.log(res.rows.map(r => r.table_name).join('\n'))
  await client.end()
})().catch(e=>{console.error(e);process.exit(1)})
