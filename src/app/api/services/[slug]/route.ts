import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/services/[slug] - Get service by slug
export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  try {
    const { slug } = context.params
    const service = await prisma.service.findUnique({
      where: {
        slug,
        active: true
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

// PUT /api/services/[slug] - Update service (admin only)
export async function PUT(request: NextRequest, context: { params: { slug: string } }) {
  const { slug } = context.params
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      shortDesc,
      features,
      price,
      duration,
      category,
      featured,
      active,
      image
    } = body

    const updated = await prisma.service.update({
      where: { slug },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(features && { features }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(category !== undefined && { category }),
        ...(featured !== undefined && { featured }),
        ...(active !== undefined && { active }),
        ...(image !== undefined && { image })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[slug] - Delete service (admin only)
export async function DELETE(request: NextRequest, context: { params: { slug: string } }) {
  try {
    const { slug } = context.params
    // Soft delete by setting active to false
    await prisma.service.update({
      where: { slug },
      data: { active: false }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
