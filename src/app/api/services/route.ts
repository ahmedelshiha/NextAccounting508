import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/services - Get all active services
export async function GET(request: NextRequest) {
  try {
    // Early fallback to avoid noisy errors when DB is not configured in dev
    if (!process.env.NETLIFY_DATABASE_URL) {
      const fallback = [
        { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
        { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
        { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
        { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
      ]
      return NextResponse.json(fallback)
    }
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const category = searchParams.get('category')

    const { default: prisma } = await import('@/lib/prisma')

    const where: Prisma.ServiceWhereInput = { active: true }

    if (featured === 'true') {
      where.featured = true
    }

    if (category) {
      where.category = category
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    // graceful fallback on runtime errors
    const fallback = [
      { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
      { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
      { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
      { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
    ]
    return NextResponse.json(fallback)
  }
}

// POST /api/services - Create a new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma')

    const body = await request.json()

    const {
      name,
      slug,
      description,
      shortDesc,
      features,
      price,
      duration,
      category,
      featured = false,
      image
    } = body

    // Basic validation
    if (!name || !slug || !description) {
      return NextResponse.json(
        { error: 'Name, slug, and description are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingService = await prisma.service.findUnique({
      where: { slug }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service with this slug already exists' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description,
        shortDesc,
        features: features || [],
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        category,
        featured,
        image,
        active: true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
