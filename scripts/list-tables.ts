import prisma from '@/lib/prisma'

async function main(){
  const rows = await prisma.$queryRaw<any>`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('tables:', rows.map(r=>r.table_name));
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
