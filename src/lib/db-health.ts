let lastStatus: { ok: boolean; at: number } | null = null

export async function isDatabaseHealthy(timeoutMs = 600): Promise<boolean> {
  const now = Date.now()
  if (lastStatus && now - lastStatus.at < 60000) {
    return lastStatus.ok
  }

  // If DB env is not configured, report unhealthy quickly without importing prisma
  const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
  if (!dbUrl) {
    lastStatus = { ok: false, at: now }
    return false
  }

  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
  const probe = (async () => {
    try {
      const { default: prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  })()

  const ok = await Promise.race([timeout, probe])
  lastStatus = { ok, at: now }
  return ok
}
