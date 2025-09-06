import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/stats/posts - Get blog post statistics
export async function GET(request: NextRequest) {
  void request
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get total posts count
    const total = await prisma.post.count()

    // Get posts by status
    const [published, drafts] = await Promise.all([
      prisma.post.count({ where: { published: true } }),
      prisma.post.count({ where: { published: false } })
    ])

    // Get posts created this month
    const thisMonth = await prisma.post.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get posts created last month for comparison
    const lastMonth = await prisma.post.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    })

    // Calculate growth percentage
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    // Get posts published this month
    const publishedThisMonth = await prisma.post.count({
      where: {
        published: true,
        publishedAt: {
          gte: startOfMonth
        }
      }
    })

    // Get most recent posts
    const recentPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get posts by author
    // Group posts by author with count, ordered by count desc (typed for Prisma v6)
    const groupArgs = {
      by: ['authorId'] as const,
      _count: { id: true },
      orderBy: [{ _count: { id: 'desc' as const } }],
    } satisfies import('@prisma/client').Prisma.PostGroupByArgs

    const postsByAuthor = (await prisma.post.groupBy(groupArgs)) as Array<{
      authorId: string | null
      _count: { id: number }
    }>

    // Get author details for the grouped data
    const authorIds = postsByAuthor.map(item => item.authorId)
    const authors = (await prisma.user.findMany({
      where: {
        id: {
          in: authorIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })) as Array<{ id: string; name: string | null; email: string }>

    const postsByAuthorWithDetails = postsByAuthor.map(item => {
      const author = authors.find(a => a.id === item.authorId)
      return {
        author: author || { name: 'Unknown', email: '' },
        count: item._count.id
      }
    })

    // Get publishing trends (last 6 months)
    const publishingTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const count = await prisma.post.count({
        where: {
          published: true,
          publishedAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      publishingTrends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        count
      })
    }

    // Get posts by category/tags (if you have categories)
    const postsByCategory = (await prisma.post.findMany({
      where: { published: true },
      select: { tags: true }
    })) as Array<{ tags: string[] | null }>

    // Count posts by tag
    const tagCounts: Record<string, number> = {}
    postsByCategory.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({
      total,
      published,
      drafts,
      thisMonth,
      lastMonth,
      growth: Math.round(growth * 100) / 100,
      publishedThisMonth,
      recentPosts: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        published: post.published,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        author: post.author
      })),
      postsByAuthor: postsByAuthorWithDetails,
      publishingTrends,
      topTags
    })
  } catch (error) {
    console.error('Error fetching post statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post statistics' },
      { status: 500 }
    )
  }
}
