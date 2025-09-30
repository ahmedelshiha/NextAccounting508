import { PrismaClient } from '@prisma/client'

async function main(){
  const prisma = new PrismaClient()
  try{
    const count = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM public.security_settings`
    console.log('rowCount:', (count as any)[0]?.count ?? 0)
    const rows: any[] = await prisma.$queryRaw`SELECT id, "tenantId" as tenantId, "createdAt" as createdAt, "updatedAt" as updatedAt FROM public.security_settings ORDER BY "createdAt" DESC LIMIT 5`
    console.log('rows:', rows)
  }catch(e){
    console.error('error querying security_settings:', e)
    process.exitCode = 2
  }finally{
    await prisma.$disconnect()
  }
}

main()
