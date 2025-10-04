import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  const serviceIds = ['cmf8xwt4x0005pomfjp0fnrpa','cmf8xwt460004pomf7snvogkj'];
  const srIds = ['sr_demo_2','sr_demo_1'];

  const services = await prisma.$queryRaw<any>`SELECT id, "tenantId" FROM public.services WHERE id IN (${Prisma.join(serviceIds)})`;
  console.log('services:', services);
  const srs = await prisma.$queryRaw<any>`SELECT id, "tenantId" FROM public."ServiceRequest" WHERE id IN (${Prisma.join(srIds)})`;
  console.log('serviceRequests:', srs);

  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
