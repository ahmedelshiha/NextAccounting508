import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/services - List all services (active and inactive)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.TEAM_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const featured = searchParams.get('featured')
    const active = searchParams.get('active')

    const hasDb = !!process.env.NETLIFY_DATABASE_URL

    if (!hasDb) {
      const fallback = [
        { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true, active: true, description: '' },
        { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true, active: true, description: '' },
        { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: false, active: true, description: '' },
        { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: false, active: true, description: '' },
      ]
      let list = fallback
      if (featured === 'true') list = list.filter(s => s.featured)
      if (active === 'true') list = list.filter(s => s.active)
      if (active === 'false') list = list.filter(s => !s.active)
      if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase()))
      return NextResponse.json(list)
    }

    const where: Prisma.ServiceWhereInput = {}
    if (featured === 'true') where.featured = true
    if (active === 'true') where.active = true
    if (active === 'false') where.active = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching admin services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}
