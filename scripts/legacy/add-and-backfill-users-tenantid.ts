import prisma from '@/lib/prisma'

async function main(){
  console.log('Ensuring users.tenantId column exists and backfilled...');
  try{
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    console.log('Column ensured');
    // Backfill to primary tenant for any nulls
    await prisma.$executeRawUnsafe(`UPDATE "users" SET "tenantId" = $1 WHERE "tenantId" IS NULL`, 'tenant_primary')
    console.log('Updated NULL tenantId to tenant_primary');
    // Ensure Tenant row exists for tenant_primary
    await prisma.$executeRawUnsafe(`INSERT INTO "Tenant" (id, slug, name) SELECT $1,$2,$3 WHERE NOT EXISTS (SELECT 1 FROM "Tenant" WHERE id = $1)`, 'tenant_primary','primary','Primary Tenant')
    console.log('Primary tenant ensured');
    // Add FK constraint
    try{
      await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "users" ADD CONSTRAINT users_tenantId_fkey FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE`)
      console.log('FK added')
    } catch(e){
      console.log('FK add likely already exists or failed harmlessly:', String(e))
    }
    // Make column NOT NULL
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "users" ALTER COLUMN "tenantId" SET NOT NULL`)
    console.log('Set NOT NULL on users.tenantId')
  }catch(e){
    console.error('Failed to add/backfill users.tenantId:', String(e))
    process.exit(1)
  } finally{
    await prisma.$disconnect()
  }
}

main().catch(e=>{console.error(e); process.exit(1)})
