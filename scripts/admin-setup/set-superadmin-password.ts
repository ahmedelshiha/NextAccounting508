import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

function getDbUrl(): string {
  const raw = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!raw) throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
  return raw.replace(/^neon:\/\//, 'postgresql://')
}

async function main() {
  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@accountingfirm.com').trim()
  const newPassword = (process.env.SUPERADMIN_NEW_PASSWORD || '').trim()
  if (!newPassword) throw new Error('SUPERADMIN_NEW_PASSWORD must be provided')

  const hash = await bcrypt.hash(newPassword, 12)

  const url = getDbUrl()
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } as any })
  const client = await pool.connect()
  try {
    const user = await client.query('SELECT id FROM public.users WHERE lower(email)=lower($1) ORDER BY "updatedAt" DESC LIMIT 1', [email])
    if (user.rowCount === 0) throw new Error(`User not found for email ${email}`)
    const userId: string = user.rows[0].id
    await client.query('UPDATE public.users SET password=$1, "updatedAt"=NOW() WHERE id=$2', [hash, userId])
    console.log(`✅ Updated password for ${email}`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('❌ Failed to set superadmin password:', e)
  process.exit(1)
})
