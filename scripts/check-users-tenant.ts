import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  const res = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenantId'`)
  console.log(res)
  await prisma.$disconnect()
}
main().catch(e=>{console.error(e); process.exit(1)})
