"use client"

import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const fallbackPosts = [
  { id: '1', title: '2024 Tax Planning Strategies for Small Businesses', slug: '2024-tax-planning', excerpt: 'Discover essential tax planning strategies...', publishedAt: '2024-01-15T00:00:00.000Z', createdAt: '2024-01-15T00:00:00.000Z', readTime: 8, tags: ['Tax Planning','Small Business'], author: { name: 'Sarah Johnson', image: null } },
  { id: '2', title: 'Understanding QuickBooks: A Complete Guide', slug: 'quickbooks-guide', excerpt: 'Master the basics of QuickBooks...', publishedAt: '2024-01-10T00:00:00.000Z', createdAt: '2024-01-10T00:00:00.000Z', readTime: 6, tags: ['QuickBooks'], author: { name: 'Emily Rodriguez', image: null } },
  { id: '3', title: 'Year-End Financial Checklist for Business Owners', slug: 'year-end-checklist', excerpt: 'Ensure your business is ready for year-end...', publishedAt: '2024-01-05T00:00:00.000Z', createdAt: '2024-01-05T00:00:00.000Z', readTime: 5, tags: ['Year-End'], author: { name: 'Michael Chen', image: null } }
]

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

export function BlogSectionClient() {
  const { data, error } = useSWR('/api/posts?limit=3', fetcher, { revalidateOnFocus: false })
  const posts = Array.isArray(data) && data.length ? data : fallbackPosts

  return (
    <section className="py-12 sm:py-16 bg-white" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="text-center mb-10" suppressHydrationWarning>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" suppressHydrationWarning>
            Latest Insights & Tips
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" suppressHydrationWarning>
            Stay informed with our latest articles on tax strategies, financial planning,
            and business growth tips from our expert team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" suppressHydrationWarning>
          {posts.map((post: any) => (
            <Card
              key={post.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden"
            >
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden" suppressHydrationWarning>
                <div className="absolute inset-0 bg-blue-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute bottom-4 left-4">
                  {(post.tags || []).slice(0, 2).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-block bg-white/90 text-blue-600 px-2 py-1 rounded text-xs font-medium mr-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <CardDescription className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </CardDescription>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    </div>
                    {post.readTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">{post.author?.name || 'Author'}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:text-blue-600 transition-colors p-0"
                    asChild
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Read More
                      <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
