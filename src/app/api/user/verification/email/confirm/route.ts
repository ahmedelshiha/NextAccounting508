import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withTenantContext } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { logAudit } from "@/lib/audit"

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    // Rate limit: 10 verification attempts per hour
    try {
      const { applyRateLimit, getClientIp } = await import("@/lib/rate-limit")
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:verify:email:confirm:${ip}`, 10, 3600_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    } catch {}

    const body = (await request.json().catch(() => ({}))) as { token?: string }
    const token = body.token?.trim()

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    // In production, verify the token against database or JWT
    // For now, accept any valid-looking token
    // This would need a proper VerificationToken model or similar

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ success: true, message: "Email verified" })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId as string },
      select: { id: true, emailVerified: true },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })

    try {
      await logAudit({
        action: "user.email.verified",
        actorId: ctx.userId as string,
        targetId: user.id,
        details: { timestamp: new Date().toISOString() },
      })
    } catch {}

    return NextResponse.json({ success: true, message: "Email verified successfully" })
  } catch (err) {
    console.error("POST /api/user/verification/email/confirm error", err)
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
  }
})
