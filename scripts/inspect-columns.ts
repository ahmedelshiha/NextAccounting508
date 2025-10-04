import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = ['users','bookings','services'];
  for (const t of tables) {
    try {
      const cols: Array<{column_name: string}> = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns WHERE table_name = ${t}
      `;
      console.log(`Columns for table ${t}:`, cols.map(c => c.column_name).join(', '));
    } catch (e) {
      console.error(`Failed to inspect table ${t}:`, String(e));
    }
  }
}

main().catch(e => { console.error(e); process.exit(1)}).finally(async () => { await prisma.$disconnect(); });
