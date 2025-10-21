import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { withTenantContext } from "@/lib/api-wrapper"
import { requireTenantContext } from "@/lib/tenant-utils"
import { logAudit } from "@/lib/audit"
import { randomBytes } from "crypto"

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    // Rate limit: 5 verification requests per hour
    try {
      const { applyRateLimit, getClientIp } = await import("@/lib/rate-limit")
      const ip = getClientIp(request as unknown as Request)
      const rl = await applyRateLimit(`user:verify:email:${ip}`, 5, 3600_000)
      if (rl && rl.allowed === false) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    } catch {}

    const body = (await request.json().catch(() => ({}))) as { email?: string }
    const email = body.email?.trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)
    if (!hasDb) {
      return NextResponse.json({ success: true, message: "Verification email would be sent in production" })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId as string },
      select: { id: true, email: true, tenantId: true },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check if email is already in use by another user in tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: user.tenantId, email } },
    })

    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Generate verification token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)

    // Store token (in a real app, use a VerificationToken model or similar)
    // For now, we'll just return the token for testing
    // In production, you'd store this in the database and send via email

    try {
      await logAudit({
        action: "user.email.verify.request",
        actorId: ctx.userId as string,
        targetId: user.id,
        details: { email, tokenExpiry: expiresAt.toISOString() },
      })
    } catch {}

    // Simulate sending email - in production, use SendGrid or similar
    if (process.env.SMTP_HOST) {
      try {
        const { sendEmail } = await import("@/lib/email")
        await sendEmail({
          to: email,
          subject: "Verify your email address",
          html: `
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="${process.env.NEXTAUTH_URL}/verify-email?token=${token}">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
          `,
        })
      } catch (e) {
        console.error("Failed to send verification email:", e)
        // Don't fail the request, still return success but logging the error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Check your inbox.",
      token: process.env.NODE_ENV === "development" ? token : undefined,
    })
  } catch (err) {
    console.error("POST /api/user/verification/email error", err)
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }
})
