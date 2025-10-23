import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const languages = await prisma.language.findMany({
      orderBy: { code: 'asc' },
    })

    const response = new Response(JSON.stringify(languages, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="languages-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

    return response
  } catch (error: any) {
    console.error('Failed to export languages:', error)
    return Response.json({ error: error.message || 'Failed to export languages' }, { status: 500 })
  }
})
