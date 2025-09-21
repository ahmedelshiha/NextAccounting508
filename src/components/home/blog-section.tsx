import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'

export const revalidate = 60

export async function BlogSection() {
  const hasDb = !!process.env.NETLIFY_DATABASE_URL
  let posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | null
    createdAt: Date
    readTime: number | null
    tags: string[]
    author: { name: string | null; image: string | null } | null
  }> = []

  if (hasDb) {
    try {
      posts = (await prisma.post.findMany({
        where: { published: true },
        include: { author: { select: { name: true, image: true } } },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 3,
      })) as Array<{
        id: string
        title: string
        slug: string
        excerpt: string | null
        publishedAt: Date | null
        createdAt: Date
        readTime: number | null
        tags: string[]
        author: { name: string | null; image: string | null } | null
      }>
    } catch {}
  }

  if (posts.length === 0) {
    posts = [
      { id: '1', title: '2024 Tax Planning Strategies for Small Businesses', slug: '2024-tax-planning', excerpt: 'Discover essential tax planning strategies...', publishedAt: new Date('2024-01-15'), createdAt: new Date('2024-01-15'), readTime: 8, tags: ['Tax Planning','Small Business'], author: { name: 'Sarah Johnson', image: null } },
      { id: '2', title: 'Understanding QuickBooks: A Complete Guide', slug: 'quickbooks-guide', excerpt: 'Master the basics of QuickBooks...', publishedAt: new Date('2024-01-10'), createdAt: new Date('2024-01-10'), readTime: 6, tags: ['QuickBooks'], author: { name: 'Emily Rodriguez', image: null } },
      { id: '3', title: 'Year-End Financial Checklist for Business Owners', slug: 'year-end-checklist', excerpt: 'Ensure your business is ready for year-end...', publishedAt: new Date('2024-01-05'), createdAt: new Date('2024-01-05'), readTime: 5, tags: ['Year-End'], author: { name: 'Michael Chen', image: null } }
    ]
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    })
  }

  return (
    <section className="py-12 sm:py-16 bg-white" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        {/* Section Header */}
        <div className="text-center mb-10" suppressHydrationWarning>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" suppressHydrationWarning>
            Latest Insights & Tips
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" suppressHydrationWarning>
            Stay informed with our latest articles on tax strategies, financial planning,
            and business growth tips from our expert team.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {posts.map((post) => (
            // Use reusable BlogCard component for clarity and reuse
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

      </div>
    </section>
  )
}
