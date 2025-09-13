import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
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
    const externalApis: Array<{ name: string; status: string; message?: string }> = []

    const summary = {
      overall: db.status === 'healthy' && email.status === 'healthy' && auth.status === 'healthy' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({ summary, db, email, auth, externalApis })
  } catch (error) {
    console.error('System health rollup error:', error)
    return NextResponse.json({ error: 'Failed to load system health' }, { status: 500 })
  }
}
