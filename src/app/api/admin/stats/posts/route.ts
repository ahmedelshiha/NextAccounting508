import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'

export const runtime = 'nodejs'

// GET /api/admin/stats/posts - Get blog post statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = getTenantFromRequest(request as unknown as Request)
    const rangeParam = (searchParams.get('range') || '').toLowerCase()
    const days = rangeParam === '7d' ? 7 : rangeParam === '30d' ? 30 : rangeParam === '90d' ? 90 : rangeParam === '1y' ? 365 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get total posts count
    const total = await prisma.post.count({ where: tenantFilter(tenantId) })

    // Get posts by status
    const [published, drafts] = await Promise.all([
      prisma.post.count({ where: { ...tenantFilter(tenantId), published: true } }),
      prisma.post.count({ where: { ...tenantFilter(tenantId), published: false } })
    ])

    // Get posts created this month
    const thisMonth = await prisma.post.count({
      where: {
        ...tenantFilter(tenantId),
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // Get posts created last month for comparison
    const lastMonth = await prisma.post.count({
      where: {
        ...tenantFilter(tenantId),
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
        ...tenantFilter(tenantId),
        published: true,
        publishedAt: {
          gte: startOfMonth
        }
      }
    })

    // Get most recent posts
    const recentPosts = await prisma.post.findMany({
      where: tenantFilter(tenantId),
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
    // Group posts by author with count, ordered by count desc (cast orderBy for Prisma v6)
    const postsByAuthor = await prisma.post.groupBy({
      by: ['authorId'],
      where: tenantFilter(tenantId),
      _count: { id: true },
    })

    postsByAuthor.sort((a, b) => b._count.id - a._count.id)

    // Get author details for the grouped data
    const authorIds = postsByAuthor.map(item => item.authorId).filter((id): id is string => !!id)
    const authors = (await prisma.user.findMany({
      where: {
        ...tenantFilter(tenantId),
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
          ...tenantFilter(tenantId),
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
      where: { ...tenantFilter(tenantId), published: true },
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

    let ranged: { range?: string; posts?: number; growth?: number } = {}
    if (days > 0) {
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
      const inRange = await prisma.post.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: start } } })
      const prevRange = await prisma.post.count({ where: { ...tenantFilter(tenantId), createdAt: { gte: prevStart, lt: start } } })
      const growthRange = prevRange > 0 ? ((inRange - prevRange) / prevRange) * 100 : 0
      ranged = { range: rangeParam, posts: inRange, growth: Math.round(growthRange * 100) / 100 }
    }

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
      topTags,
      range: ranged
    })
  } catch (error) {
    console.error('Error fetching post statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post statistics' },
      { status: 500 }
    )
  }
}
