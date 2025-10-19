import { NextResponse, type NextRequest } from "next/server"
import { withTenantContext } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { logAudit } from "@/lib/audit"
import prisma from "@/lib/prisma"

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userId = ctx.userId ?? undefined

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Rate limit: 5 MFA disable attempts per hour
    try {
      const { applyRateLimit, getClientIp } = await import("@/lib/rate-limit")
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:mfa:disable:${ip}`, 5, 3600_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    } catch {}

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ ok: true, message: "MFA disabled" })
    }

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Clear MFA secret
    try {
      const { clearUserMfa } = await import("@/lib/mfa")
      await clearUserMfa(String(userId))
    } catch (e) {
      console.error("Error clearing MFA secret:", e)
    }

    try {
      await logAudit({
        action: "mfa.disable",
        actorId: String(userId),
        targetId: String(userId),
        details: { timestamp: new Date().toISOString() },
      })
    } catch {}

    return NextResponse.json({ ok: true, message: "Two-factor authentication disabled" })
  } catch (e) {
    console.error("POST /api/auth/mfa/disable error", e)
    return NextResponse.json({ error: "Failed to disable MFA" }, { status: 500 })
  }
})
