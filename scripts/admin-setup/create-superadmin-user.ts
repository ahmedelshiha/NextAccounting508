import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function getDbUrl(): string {
  const raw = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
  if (!raw) throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL must be set')
  return raw.replace(/^neon:\/\//, 'postgresql://')
}

function getEnvOrGenerate(name: string, fallbackLen = 12): string {
  const v = process.env[name]
  if (v && v.trim()) return v.trim()
  const gen = crypto.randomBytes(fallbackLen).toString('hex')
  console.warn(`Warning: ${name} not set, generated temporary value: ${gen}`)
  return gen
}

async function ensureSuperAdmin() {
  const url = getDbUrl()
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } as any })
  const client = await pool.connect()
  try {
    // Resolve tenantId: prefer first row in security_settings
    const tenantRow = await client.query('SELECT "tenantId" FROM public.security_settings ORDER BY "createdAt" ASC LIMIT 1')
    if (tenantRow.rowCount === 0) throw new Error('No tenants found via security_settings; please create a tenant first')
    const tenantId: string = tenantRow.rows[0].tenantId

    const email = process.env.SUPERADMIN_EMAIL?.trim() || 'superadmin@accountingfirm.com'
    const plain = getEnvOrGenerate('SEED_SUPERADMIN_PASSWORD')
    const hashed = await bcrypt.hash(plain, 12)

    // Find or create user in users table
    const userSelect = await client.query(
      'SELECT id FROM public.users WHERE "tenantId" = $1 AND lower(email) = lower($2) LIMIT 1',
      [tenantId, email]
    )

    let userId: string
    if (userSelect.rowCount > 0) {
      userId = userSelect.rows[0].id
      await client.query(
        'UPDATE public.users SET role = $1, password = $2, "emailVerified" = NOW(), name = COALESCE(name,$3), "updatedAt" = NOW() WHERE id = $4',
        ['SUPER_ADMIN', hashed, 'Super Admin', userId]
      )
      console.log(`✅ Updated existing user ${email} to SUPER_ADMIN in tenant ${tenantId}`)
    } else {
      userId = crypto.randomUUID()
      await client.query(
        'INSERT INTO public.users (id, "tenantId", email, name, password, role, "emailVerified", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW(),NOW())',
        [userId, tenantId, email, 'Super Admin', hashed, 'SUPER_ADMIN']
      )
      console.log(`✅ Created SUPER_ADMIN user ${email} in tenant ${tenantId}`)
    }

    // Ensure tenant_memberships row
    try {
      const mem = await client.query(
        'SELECT id FROM public.tenant_memberships WHERE "userId" = $1 AND "tenantId" = $2 LIMIT 1',
        [userId, tenantId]
      )
      if (mem.rowCount === 0) {
        const memId = crypto.randomUUID()
        await client.query(
          'INSERT INTO public.tenant_memberships (id, "userId", "tenantId", role, "isDefault", "createdAt") VALUES ($1,$2,$3,$4,$5,NOW())',
          [memId, userId, tenantId, 'SUPER_ADMIN', true]
        )
        console.log('✅ Added tenant membership as SUPER_ADMIN (default)')
      } else {
        await client.query('UPDATE public.tenant_memberships SET role = $1 WHERE id = $2', ['SUPER_ADMIN', mem.rows[0].id])
        console.log('✅ Ensured tenant membership role SUPER_ADMIN')
      }
    } catch (err) {
      console.warn('⚠️ Skipping tenant_memberships sync (table missing or schema drift):', (err as any)?.message)
    }

    console.log('Credentials:')
    console.log(`  Email: ${email}`)
    if (!process.env.SUPERADMIN_EMAIL || !process.env.SEED_SUPERADMIN_PASSWORD) {
      console.log(`  Temporary Password: ${plain}`)
    } else {
      console.log('  Password set from environment variable.')
    }
  } finally {
    client.release()
    await pool.end()
  }
}

ensureSuperAdmin().catch((e) => {
  console.error('❌ Failed to create/update SUPER_ADMIN:', e)
  process.exit(1)
})
