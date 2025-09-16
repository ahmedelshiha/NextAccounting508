import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return respond.unauthorized()
    }

    const results: Record<string, any> = {}

    try { results.notificationSettingsCount = await prisma.notificationSettings.count() } catch (e) { results.notificationSettingsCount = 0 }
    try { results.priceOverrideCount = await prisma.priceOverride.count() } catch (e) { results.priceOverrideCount = 0 }
    try { results.requestTaskCount = await prisma.requestTask.count() } catch (e) { results.requestTaskCount = 0 }
    try { results.serviceRequestCommentCount = await prisma.serviceRequestComment.count() } catch (e) { results.serviceRequestCommentCount = 0 }
    try { results.serviceRequestCount = await prisma.serviceRequest.count() } catch (e) { results.serviceRequestCount = 0 }
    try { results.sessionCount = await prisma.session.count() } catch (e) { results.sessionCount = 0 }
    try { results.taskCommentCount = await prisma.task.count() } catch (e) { results.taskCommentCount = 0 }

    // include small sample rows for quick inspection
    results.samples = {}
    try { results.samples.services = await prisma.service.findMany({ take: 5, orderBy: { createdAt: 'desc' } }) } catch (e) { results.samples.services = [] }
    try { results.samples.serviceRequests = await prisma.serviceRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' } }) } catch (e) { results.samples.serviceRequests = [] }
    try { results.samples.serviceRequestComments = await prisma.serviceRequestComment.findMany({ take: 5, orderBy: { createdAt: 'desc' } }) } catch (e) { results.samples.serviceRequestComments = [] }
    try { results.samples.requestTasks = await prisma.requestTask.findMany({ take: 5, orderBy: { createdAt: 'desc' } }) } catch (e) { results.samples.requestTasks = [] }

    // expose current effective DB URL hint (redacted)
    try {
      const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || null
      results.db = url ? (String(url).slice(0, 40) + (String(url).length > 40 ? '...' : '')) : null
    } catch (e) {}

    return respond.ok(results)
  } catch (error) {
    console.error('db-status error', error)
    return respond.serverError('Failed to inspect database')
  }
}
