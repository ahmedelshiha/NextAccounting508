import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  const rows = await prisma.$queryRaw<any>`SELECT DISTINCT "tenantId" FROM public.bookings`;
  console.log('booking tenantIds:', rows.map(r => r.tenantId));
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
