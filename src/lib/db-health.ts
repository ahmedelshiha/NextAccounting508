import prisma from '@/lib/prisma'

let lastStatus: { ok: boolean; at: number } | null = null

export async function isDatabaseHealthy(timeoutMs = 600): Promise<boolean> {
  const now = Date.now()
  if (lastStatus && now - lastStatus.at < 60000) {
    return lastStatus.ok
  }

  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
  const probe = prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false)

  const ok = await Promise.race([timeout, probe])
  lastStatus = { ok, at: now }
  return ok
}
