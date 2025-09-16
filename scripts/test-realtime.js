const { neon } = require('@netlify/neon')
;(async () => {
  const sql = neon()
  try {
    await sql`CREATE TABLE IF NOT EXISTS "RealtimeEvents" (
      id BIGSERIAL PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    const inserted = await sql`INSERT INTO "RealtimeEvents" (payload) VALUES (${JSON.stringify({ test: 'ping', ts: new Date().toISOString() })}::jsonb) RETURNING id`
    const rows = await sql`SELECT id, payload, created_at FROM "RealtimeEvents" ORDER BY id DESC LIMIT 5`
    console.log('Inserted id:', inserted?.[0]?.id)
    console.log('Recent rows:', rows)
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    process.exit(0)
  }
})()
