import prisma from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = process.argv[2]
  const tenantId = process.argv[3]
  const newPassword = process.argv[4]
  if (!email || !tenantId || !newPassword) {
    console.error('Usage: tsx scripts/admin-setup/reset-password.ts <email> <tenantId> <newPassword>')
    process.exit(1)
  }
  const hashed = await bcrypt.hash(newPassword, 12)
  const user = await prisma.user.update({
    where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    data: { password: hashed, sessionVersion: { increment: 1 } },
  }).catch((e) => { console.error('Failed to update user', e); process.exit(1) })
  console.log('Password reset for', user.id)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
