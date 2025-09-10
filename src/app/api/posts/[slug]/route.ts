import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

// GET /api/posts/[slug] - Get post by slug
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const session = await getServerSession(authOptions)

    const where: Prisma.PostWhereInput = { slug }

    // Only show published posts for non-admin users
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      where.published = true
    }

    const post = await prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[slug] - Update post (admin/staff only)
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      title,
      content,
      excerpt,
      published,
      featured,
      coverImage,
      seoTitle,
      seoDescription,
      tags,
      readTime,
      // Advanced fields
      status,
      archived,
      scheduledAt,
      priority,
      category,
      reviewRequired,
      isCompliant,
      approvedBy,
      version,
      shares,
      comments
    } = body

    // Check if post exists
    const existingPost = await prisma.post.findUnique({ where: { slug } })
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Partial<import('@prisma/client').Prisma.PostUpdateInput> = {}

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (published !== undefined) {
      updateData.published = published
      if (published && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (tags !== undefined) updateData.tags = tags
    if (readTime !== undefined) updateData.readTime = readTime ? parseInt(readTime) : null

    // Advanced updates
    if (status !== undefined) (updateData as any).status = typeof status === 'string' ? status.toUpperCase() : status
    if (archived !== undefined) (updateData as any).archived = archived
    if (scheduledAt !== undefined) (updateData as any).scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (priority !== undefined) (updateData as any).priority = typeof priority === 'string' ? priority.toUpperCase() : priority
    if (category !== undefined) (updateData as any).category = category
    if (reviewRequired !== undefined) (updateData as any).reviewRequired = reviewRequired
    if (isCompliant !== undefined) (updateData as any).isCompliant = isCompliant
    if (approvedBy !== undefined) (updateData as any).approvedBy = approvedBy
    if (version !== undefined) (updateData as any).version = version
    if (shares !== undefined) (updateData as any).shares = shares
    if (comments !== undefined) (updateData as any).comments = comments

    // Keep publishedAt consistent with status change
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status
    if (normalizedStatus === 'PUBLISHED' && !existingPost.publishedAt) {
      (updateData as any).publishedAt = new Date()
      updateData.published = true
    }

    const post = await prisma.post.update({
      where: { slug },
      data: updateData,
      include: { author: { select: { id: true, name: true, image: true } } }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[slug] - Delete post (admin only)
export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user?.role ?? '') !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.post.delete({
      where: { slug }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
