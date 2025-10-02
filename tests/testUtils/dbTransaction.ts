import prisma from '@/lib/prisma'

export type CreatedRecord = { model: string; id: string }

export function createTestTx() {
  const created: CreatedRecord[] = []

  function registerCreated(model: string, id: string) {
    if (!model || !id) return
    created.push({ model, id })
  }

  async function rollback() {
    // delete in reverse order
    for (const rec of created.slice().reverse()) {
      try {
        switch (rec.model) {
          case 'service':
            await prisma.service.deleteMany({ where: { id: rec.id } }).catch(() => {})
            break
          case 'organizationSettings':
            await prisma.organizationSettings.deleteMany({ where: { id: rec.id } }).catch(() => {})
            break
          case 'booking':
            await prisma.booking.deleteMany({ where: { id: rec.id } }).catch(() => {})
            break
          case 'user':
            await prisma.user.deleteMany({ where: { id: rec.id } }).catch(() => {})
            break
          default:
            // best-effort generic attempt
            try {
              // @ts-ignore
              if (prisma[rec.model] && typeof prisma[rec.model].deleteMany === 'function') {
                // @ts-ignore
                await prisma[rec.model].deleteMany({ where: { id: rec.id } }).catch(() => {})
              }
            } catch {}
        }
      } catch {}
    }
    created.length = 0
  }

  return { registerCreated, rollback, created }
}

export async function withTestTx(fn: (ctx: ReturnType<typeof createTestTx>) => Promise<void>) {
  const ctx = createTestTx()
  try {
    await fn(ctx)
  } finally {
    await ctx.rollback()
  }
}
