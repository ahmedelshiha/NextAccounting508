import prisma from '../src/lib/prisma'

async function main() {
  console.log('🔎 Running seed smoke checks...')
  const users = await prisma.user.count()
  const teamMembers = await prisma.teamMember.count()
  const services = await prisma.service.count()

  if (users < 1) throw new Error('No users created')
  if (teamMembers < 1) throw new Error('No team members created')
  if (services < 1) throw new Error('No services created')

  console.log('✅ Smoke checks passed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('Smoke checks failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
