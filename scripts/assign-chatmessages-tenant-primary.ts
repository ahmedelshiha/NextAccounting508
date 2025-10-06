import prisma from '@/lib/prisma'

async function main(){
  console.log('Listing chat_messages with NULL tenantId...')
  const rows = await prisma.$queryRaw<any>`SELECT id, "userId", room, text, "createdAt" FROM chat_messages WHERE "tenantId" IS NULL`;
  console.log('to-assign:', rows)

  console.log('Assigning tenant_primary to these chat messages...')
  await prisma.$executeRawUnsafe(`UPDATE chat_messages SET "tenantId" = $1 WHERE "tenantId" IS NULL`, 'tenant_primary')

  const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM chat_messages WHERE "tenantId" IS NULL`)
  console.log('Remaining NULL:', count)

  await prisma.$disconnect()
}

main().catch(e=>{console.error(e); process.exit(1)})
