import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/posts/[slug] - Get post by slug
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const session = await getServerSession(authOptions)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { slug }

    // Only show published posts for non-admin users
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      where.published = true
    }

    const post = await prisma.post.findUnique({
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
      readTime
    } = body

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { slug }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (published !== undefined) {
      updateData.published = published
      // Set publishedAt when publishing for the first time
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

    const post = await prisma.post.update({
      where: { slug },
      data: updateData,
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
