import prisma from '@/lib/prisma'
import { resolveTenantId, runWithTenantRLSContext, disconnectPrisma } from './tenant-rls-utils'

async function main() {
  // Optional tenant filter; when provided, run under RLS and show recent bookings for that tenant
  const tenantId = resolveTenantId({ required: false })

  if (tenantId) {
    const bookings = await runWithTenantRLSContext(tenantId, async (tx: any) => {
      return tx.booking.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: { id: true, clientId: true, serviceId: true, serviceRequestId: true, tenantId: true, createdAt: true }
      })
    })
    console.log(`Recent bookings for tenant ${tenantId}:`)
    for (const b of bookings) console.log(b)
    return
  }

  // Default behavior: audit for rows missing tenantId (pre-RLS maintenance)
  const rows = await prisma.$queryRaw<any>`SELECT id, "clientId", "serviceId", "serviceRequestId", "tenantId", "createdAt" FROM public.bookings WHERE "tenantId" IS NULL`;
  console.log('Bookings with NULL tenantId:');
  for (const r of rows) console.log(r);
}

main()
  .catch(e=>{console.error(e); process.exit(1)})
  .finally(async ()=>{await disconnectPrisma()});
