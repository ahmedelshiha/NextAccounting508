import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getRealtimeMetrics } from '@/lib/realtime-enhanced'

export const runtime = 'nodejs'

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DB health
    let db = { status: 'unavailable' as 'healthy' | 'degraded' | 'unavailable', message: '' as string | undefined }
    try {
      if (process.env.NETLIFY_DATABASE_URL) {
        await prisma.$queryRaw`SELECT 1`
        db = { status: 'healthy', message: undefined }
      } else {
        db = { status: 'degraded', message: 'Database URL not set' }
      }
    } catch (e) {
      db = { status: 'unavailable', message: 'DB query failed' }
      console.error('Health DB check failed:', e)
    }

    // Email (SendGrid) health (config check only)
    const emailConfigured = Boolean(process.env.SENDGRID_API_KEY)
    const email = { status: emailConfigured ? ('healthy' as const) : ('degraded' as const), message: emailConfigured ? undefined : 'SENDGRID_API_KEY not set' }

    // Auth health (env presence)
    const authConfigured = Boolean(process.env.NEXTAUTH_URL) && Boolean(process.env.NEXTAUTH_SECRET)
    const auth = { status: authConfigured ? ('healthy' as const) : ('degraded' as const), message: authConfigured ? undefined : 'NEXTAUTH envs missing' }

    // External APIs placeholder (extend as integrations added)
    const externalApis = [
      { name: 'Neon', status: process.env.NETLIFY_DATABASE_URL ? 'healthy' : 'degraded', message: process.env.NETLIFY_DATABASE_URL ? undefined : 'NETLIFY_DATABASE_URL missing' },
    ]

    const realtime = getRealtimeMetrics()

    const summary = {
      overall: db.status === 'healthy' && email.status === 'healthy' && auth.status === 'healthy' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({ summary, db, email, auth, externalApis, realtime })
  } catch (error) {
    console.error('System health rollup error:', error)
    return NextResponse.json({ error: 'Failed to load system health' }, { status: 500 })
  }
}
