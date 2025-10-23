import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code.toLowerCase()
    const body = await req.json()
    const { name, nativeName, direction, flag, bcp47Locale, enabled } = body

    const language = await prisma.language.update({
      where: { code },
      data: {
        ...(name && { name }),
        ...(nativeName && { nativeName }),
        ...(direction && { direction }),
        ...(flag !== undefined && { flag }),
        ...(bcp47Locale && { bcp47Locale }),
        ...(enabled !== undefined && { enabled }),
      },
    })

    return Response.json({ success: true, data: language })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json({ error: 'Language not found' }, { status: 404 })
    }
    console.error('Failed to update language:', error)
    return Response.json({ error: error.message || 'Failed to update language' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code.toLowerCase()

    if (code === 'en') {
      return Response.json({ error: 'Cannot delete the default language (en)' }, { status: 400 })
    }

    await prisma.language.delete({
      where: { code },
    })

    return Response.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json({ error: 'Language not found' }, { status: 404 })
    }
    console.error('Failed to delete language:', error)
    return Response.json({ error: error.message || 'Failed to delete language' }, { status: 500 })
  }
}
