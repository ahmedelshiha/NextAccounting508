import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const names = ['User','users','ServiceRequest','service_requests','Service','services','Attachment','attachments','BookingSettings','booking_settings','IdempotencyKey','idempotencykey','chat_messages','ChatMessage']

async function main(){
    const list = names.map(n => `'${n}'`).join(', ')
  const res = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${list})`)
  console.log(res)
  await prisma.$disconnect()
}

main().catch(e=>{console.error(e); process.exit(1)})
