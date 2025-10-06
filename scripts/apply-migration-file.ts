import fs from 'fs';
import prisma from '@/lib/prisma'

async function applyMigration(path: string) {
  if (!fs.existsSync(path)) {
    console.log('Migration file not found:', path);
    return;
  }
  const sql = fs.readFileSync(path, 'utf8');
  const parts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const stmt of parts) {
    try {
      console.log('Executing statement:', stmt.slice(0, 120));
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      console.error('Statement failed:', String(err));
      throw err;
    }
  }
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: tsx scripts/apply-migration-file.ts <path-to-sql>');
    process.exit(1);
  }
  try {
    await applyMigration(path);
    console.log('Migration applied successfully:', path);
  } catch (e) {
    console.error('Migration failed:', String(e));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1) });
