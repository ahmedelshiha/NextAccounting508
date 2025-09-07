import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Post = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  published: boolean
  featured: boolean
  tags: string[]
  publishedAt?: string | Date | null
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<'all'|'published'|'drafts'>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/posts?limit=100')
        if (res.ok) setPosts(await res.json())
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return posts.filter(p => {
      const matchQ = !q || p.title.toLowerCase().includes(ql) || p.slug.toLowerCase().includes(ql)
      const matchPub = publishedFilter === 'all' || (publishedFilter === 'published' ? p.published : !p.published)
      return matchQ && matchPub
    })
  }, [posts, q, publishedFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-28" />))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-purple-600" /> Posts
            </h1>
            <p className="text-gray-600 mt-2">Review and manage blog posts</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" placeholder="Search by title or slug" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Button variant={publishedFilter==='all'? 'default':'outline'} onClick={() => setPublishedFilter('all')}>All</Button>
                <Button variant={publishedFilter==='published'? 'default':'outline'} onClick={() => setPublishedFilter('published')}>Published</Button>
                <Button variant={publishedFilter==='drafts'? 'default':'outline'} onClick={() => setPublishedFilter('drafts')}>Drafts</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <Card key={p.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{p.title}</CardTitle>
                <CardDescription className="truncate">/{p.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    {p.published ? (
                      <Badge className="bg-green-100 text-green-800">Published</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                    )}
                    {p.featured && (
                      <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/blog/${p.slug}`}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-gray-500">No posts found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
