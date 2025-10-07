import prisma from '../../src/lib/prisma'

async function main() {
  const email = process.argv[2]
  const tenantId = process.argv[3]
  if (!email || !tenantId) {
    console.error('Usage: tsx scripts/admin-setup/disable-mfa.ts <email> <tenantId>')
    process.exit(1)
  }
  const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email: email.toLowerCase() } }, select: { id: true } })
  if (!user) { console.error('User not found'); process.exit(1) }
  const SECRET_PREFIX = 'mfa:secret:'
  const BACKUP_PREFIX = 'mfa:backup:'
  await prisma.verificationToken.deleteMany({ where: { OR: [ { identifier: `${SECRET_PREFIX}${user.id}` }, { identifier: { startsWith: `${BACKUP_PREFIX}${user.id}:` } } ] } })
  await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } })
  console.log('MFA disabled and session invalidated for', user.id)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
