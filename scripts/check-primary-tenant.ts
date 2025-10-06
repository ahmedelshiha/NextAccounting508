import prisma from '@/lib/prisma'

async function main(){
  const t = await prisma.$queryRaw<any>`SELECT id, slug FROM public.tenants WHERE slug = 'primary' LIMIT 1`;
  console.log('primary tenant:', t);
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
