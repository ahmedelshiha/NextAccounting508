import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<any>`SELECT id, "clientId", "serviceId", "serviceRequestId", "tenantId", "createdAt" FROM public.bookings WHERE "tenantId" IS NULL`;
  console.log('Bookings with NULL tenantId:');
  for (const r of rows) console.log(r);
}

main().catch(e=>{console.error(e); process.exit(1)}).finally(async ()=>{await prisma.$disconnect()});
