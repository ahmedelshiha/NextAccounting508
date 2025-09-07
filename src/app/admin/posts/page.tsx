"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Search, Eye, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Post = {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string | null
  published: boolean
  featured: boolean
  tags: string[]
  coverImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  readTime?: number | null
  publishedAt?: string | Date | null
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<'all'|'published'|'drafts'>('all')

  // Selection + edit form state
  const [selected, setSelected] = useState<Post | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editExcerpt, setEditExcerpt] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editPublished, setEditPublished] = useState(false)

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newExcerpt, setNewExcerpt] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newFeatured, setNewFeatured] = useState(false)
  const [newPublished, setNewPublished] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/posts?limit=100')
        if (res.ok) setPosts(await res.json())
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const selectPost = (p: Post) => {
    setSelected(p)
    setEditTitle(p.title)
    setEditExcerpt(p.excerpt || '')
    setEditContent(p.content || '')
    setEditTags(p.tags?.join(', ') || '')
    setEditFeatured(!!p.featured)
    setEditPublished(!!p.published)
  }

  const reload = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/posts?limit=100')
      if (res.ok) setPosts(await res.json())
    } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    return posts.filter(p => {
      const matchQ = !q || p.title.toLowerCase().includes(ql) || p.slug.toLowerCase().includes(ql)
      const matchPub = publishedFilter === 'all' || (publishedFilter === 'published' ? p.published : !p.published)
      return matchQ && matchPub
    })
  }, [posts, q, publishedFilter])

  const saveEdits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const body = {
      title: editTitle,
      excerpt: editExcerpt,
      content: editContent,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      featured: editFeatured,
      published: editPublished,
    }
    const res = await apiFetch(`/api/posts/${encodeURIComponent(selected.slug)}` ,{
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      setSelected(null)
      reload()
    }
  }

  const deletePost = async () => {
    if (!selected) return
    if (!confirm('Delete this post permanently?')) return
    const res = await apiFetch(`/api/posts/${encodeURIComponent(selected.slug)}`, { method: 'DELETE' })
    if (res.ok) {
      setSelected(null)
      reload()
    }
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      title: newTitle,
      slug: newSlug,
      excerpt: newExcerpt,
      content: newContent,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      featured: newFeatured,
      published: newPublished,
    }
    const res = await apiFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      setNewTitle(''); setNewSlug(''); setNewExcerpt(''); setNewContent(''); setNewTags(''); setNewFeatured(false); setNewPublished(false)
      reload()
    }
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(p => (
              <button key={p.id} onClick={() => selectPost(p)} className={`text-left rounded-lg border bg-white overflow-hidden transition focus:outline-none ${selected?.id === p.id ? 'ring-2 ring-purple-500 border-purple-300' : ''}`}>
                <Card>
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
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-gray-500">No posts found.</div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selected ? 'Edit Post' : 'Create Post'}</CardTitle>
              <CardDescription>{selected ? `Editing /${selected.slug}` : 'Add a new post'}</CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <form onSubmit={saveEdits} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-700">Title</label>
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Slug</label>
                    <Input value={selected.slug} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Excerpt</label>
                    <Textarea value={editExcerpt} onChange={e => setEditExcerpt(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Content</label>
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Tags (comma separated)</label>
                    <Input value={editTags} onChange={e => setEditTags(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input id="edit-published" type="checkbox" checked={editPublished} onChange={e => setEditPublished(e.target.checked)} />
                      <label htmlFor="edit-published" className="text-sm text-gray-700">Published</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="edit-featured" type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} />
                      <label htmlFor="edit-featured" className="text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="submit" className="w-full">Save Changes</Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setSelected(null)}>Cancel</Button>
                  </div>
                  <Button type="button" variant="destructive" className="w-full flex items-center justify-center gap-2" onClick={deletePost}>
                    <Trash2 className="h-4 w-4" /> Delete Post
                  </Button>
                </form>
              ) : (
                <form onSubmit={createPost} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-700">Title</label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Slug</label>
                    <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Excerpt</label>
                    <Textarea value={newExcerpt} onChange={e => setNewExcerpt(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Content</label>
                    <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Tags (comma separated)</label>
                    <Input value={newTags} onChange={e => setNewTags(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input id="new-published" type="checkbox" checked={newPublished} onChange={e => setNewPublished(e.target.checked)} />
                      <label htmlFor="new-published" className="text-sm text-gray-700">Published</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="new-featured" type="checkbox" checked={newFeatured} onChange={e => setNewFeatured(e.target.checked)} />
                      <label htmlFor="new-featured" className="text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Create Post</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
