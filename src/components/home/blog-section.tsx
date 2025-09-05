'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  readTime: number
  tags: string[]
  author: {
    name: string
    image?: string
  }
}

export function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts?published=true&limit=3')
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        } else {
          // fallback to static posts when API fails
          setPosts([
            { id: '1', title: '2024 Tax Planning Strategies for Small Businesses', slug: '2024-tax-planning', excerpt: 'Discover essential tax planning strategies...', publishedAt: '2024-01-15', readTime: 8, tags: ['Tax Planning','Small Business'], author: { name: 'Sarah Johnson' } },
            { id: '2', title: 'Understanding QuickBooks: A Complete Guide', slug: 'quickbooks-guide', excerpt: 'Master the basics of QuickBooks...', publishedAt: '2024-01-10', readTime: 6, tags: ['QuickBooks'], author: { name: 'Emily Rodriguez' } },
            { id: '3', title: 'Year-End Financial Checklist for Business Owners', slug: 'year-end-checklist', excerpt: 'Ensure your business is ready for year-end...', publishedAt: '2024-01-05', readTime: 5, tags: ['Year-End'], author: { name: 'Michael Chen' } }
          ])
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        setPosts([
          { id: '1', title: '2024 Tax Planning Strategies for Small Businesses', slug: '2024-tax-planning', excerpt: 'Discover essential tax planning strategies...', publishedAt: '2024-01-15', readTime: 8, tags: ['Tax Planning','Small Business'], author: { name: 'Sarah Johnson' } },
          { id: '2', title: 'Understanding QuickBooks: A Complete Guide', slug: 'quickbooks-guide', excerpt: 'Master the basics of QuickBooks...', publishedAt: '2024-01-10', readTime: 6, tags: ['QuickBooks'], author: { name: 'Emily Rodriguez' } },
          { id: '3', title: 'Year-End Financial Checklist for Business Owners', slug: 'year-end-checklist', excerpt: 'Ensure your business is ready for year-end...', publishedAt: '2024-01-05', readTime: 5, tags: ['Year-End'], author: { name: 'Michael Chen' } }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Latest Insights & Tips
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with our latest articles on tax strategies, financial planning, 
            and business growth tips from our expert team.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden"
            >
              {/* Featured Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute bottom-4 left-4">
                  {post.tags.slice(0, 2).map((tag) => (
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

                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    {post.readTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">{post.author.name}</span>
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

        {/* CTA Section */}
        <div className="text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Stay Updated with Tax & Financial Tips
          </h3>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Get our latest insights delivered to your inbox. No spam, just valuable 
            content to help your business thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
