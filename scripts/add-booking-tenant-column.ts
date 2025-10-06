import prisma from '@/lib/prisma'

async function main(){
  console.log('Adding tenantId column to bookings if missing...')
  try{
    await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS "tenantId" TEXT`)
    console.log('ALTER TABLE executed')
    // add index if not exists
    await prisma.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'bookings_tenantId_idx') THEN CREATE INDEX "bookings_tenantId_idx" ON public.bookings ("tenantId"); END IF; END$$;`)
    console.log('Index ensured')
  }catch(err){
    console.error('Error adding column:', err)
    process.exit(1)
  }finally{
    await prisma.$disconnect()
  }
}

main()
  .then(()=>console.log('Done'))
  .catch((e)=>{console.error(e); process.exit(1)})
