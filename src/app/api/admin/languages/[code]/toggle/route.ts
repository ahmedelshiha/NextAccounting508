import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code.toLowerCase()

    const language = await prisma.language.findUnique({
      where: { code },
    })

    if (!language) {
      return Response.json({ error: 'Language not found' }, { status: 404 })
    }

    const updated = await prisma.language.update({
      where: { code },
      data: { enabled: !language.enabled },
    })

    return Response.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Failed to toggle language:', error)
    return Response.json({ error: error.message || 'Failed to toggle language' }, { status: 500 })
  }
}
