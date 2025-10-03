import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting legalLinks migration...')
  const rows = await prisma.organizationSettings.findMany({ where: {}, select: { id: true, legalLinks: true } })
  let updated = 0
  for (const r of rows) {
    const ll = r.legalLinks as any
    const terms = ll?.terms ?? null
    const privacy = ll?.privacy ?? null
    const refund = ll?.refund ?? null
    if (terms || privacy || refund) {
      await prisma.organizationSettings.update({ where: { id: r.id }, data: { termsUrl: terms, privacyUrl: privacy, refundUrl: refund } })
      updated++
    }
  }
  console.log(`Migration completed. Updated ${updated} rows.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
