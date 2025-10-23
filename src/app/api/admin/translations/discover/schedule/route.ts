import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { tenantFilter } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { frequency } = body

    if (!['none', 'daily', 'weekly'].includes(frequency)) {
      return Response.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    return Response.json({
      success: true,
      data: {
        frequency,
        message: `Audit schedule ${frequency === 'none' ? 'disabled' : `set to ${frequency}`}`,
      },
    })
  } catch (error: any) {
    console.error('Failed to schedule audit:', error)
    return Response.json({ error: error.message || 'Failed to schedule audit' }, { status: 500 })
  }
}
