import prisma from '@/lib/prisma'

async function main() {
  const rows = await prisma.securitySettings.findMany({
    select: {
      id: true,
      tenantId: true,
      superAdmin: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  console.log('security_settings superAdmin samples:', rows)
}

main()
  .catch((error) => {
    console.error('Failed to inspect security_settings.superAdmin values', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
