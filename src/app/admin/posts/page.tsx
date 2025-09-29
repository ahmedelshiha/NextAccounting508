"use client"

'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Download, Image as ImageIcon, Loader2, Plus, RefreshCw, Save, Upload, X, Eye, ExternalLink, Calendar, Tag } from 'lucide-react'
import Image from 'next/image'
import type { FilterConfig } from '@/types/dashboard'
import PostCard from '@/components/admin/posts/PostCard'
import PostStats from '@/components/admin/posts/PostStats'
import type { Post, PostPriority, PostStatus } from '@/components/admin/posts/types'

// Categories and priorities
const categories = [
  'Tax Planning',
  'Financial Planning',
  'Compliance',
  'Business Strategy',
  'Industry News',
  'Tax Law',
  'Audit & Assurance',
  'Payroll Services',
  'Business Formation'
]

const priorities: { value: PostPriority; label: string }[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' }
]

// API shapes
type ApiAuthor = { id: string; name?: string | null; image?: string | null }
export type ApiPost = {
  id: string
  title: string
  slug: string
  content?: string | null
  excerpt?: string | null
  published?: boolean
  featured?: boolean
  tags?: string[]
  coverImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  readTime?: number | null
  publishedAt?: string | Date | null
  updatedAt?: string | Date | null
  views?: number
  author?: ApiAuthor | null
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | null
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null
  lastModified?: string | Date | null
  isCompliant?: boolean
  reviewRequired?: boolean
  approvedBy?: string | null
  version?: number
  shares?: number
  comments?: number
  category?: string | null
  archived?: boolean
  scheduledAt?: string | Date | null
}

// Form state
type PostFormData = {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string
  featured: boolean
  published: boolean
  coverImage?: File | null
  seoTitle: string
  seoDescription: string
  category: string
  publishedAt?: string
  scheduledAt?: string
  priority: PostPriority
  reviewRequired: boolean
}

type ValidationError = { field: string; message: string }

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | PostPriority>('all')
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all')
  const [sortBy, setSortBy] = useState<'lastModified' | 'publishedAt' | 'views' | 'title'>('lastModified')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const mapToEnhancedPost = (p: ApiPost): Post => {
    const persistedStatus = p.status ? String(p.status).toLowerCase() as PostStatus : undefined
    const computedStatus: PostStatus = persistedStatus || (p.archived ? 'archived' : p.published ? 'published' : p.scheduledAt ? 'scheduled' : 'draft')
    const persistedPriority = p.priority ? String(p.priority).toLowerCase() as PostPriority : undefined
    const computedPriority: PostPriority = persistedPriority || (p.featured ? 'high' : 'medium')
    const author = p.author ? { id: p.author.id, name: p.author.name ?? 'Unknown', avatar: p.author.image ?? null, role: 'Author' } : null
    const contentStr = typeof p.content === 'string' ? p.content : ''
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: contentStr,
      excerpt: p.excerpt ?? null,
      published: !!p.published,
      featured: !!p.featured,
      tags: Array.isArray(p.tags) ? p.tags : [],
      coverImage: p.coverImage ?? null,
      seoTitle: p.seoTitle ?? null,
      seoDescription: p.seoDescription ?? null,
      readTime: p.readTime ?? undefined,
      publishedAt: p.publishedAt ?? null,
      updatedAt: p.updatedAt ?? null,
      views: p.views ?? 0,
      author,
      status: computedStatus,
      priority: computedPriority,
      lastModified: p.updatedAt ?? null,
      wordCount: contentStr ? contentStr.trim().split(/\s+/).length : 0,
      isCompliant: p.isCompliant ?? true,
      reviewRequired: p.reviewRequired ?? false,
      approvedBy: p.approvedBy ?? undefined,
      version: typeof p.version === 'number' ? p.version : 1,
      shares: typeof p.shares === 'number' ? p.shares : 0,
      comments: typeof p.comments === 'number' ? p.comments : 0,
      category: p.category ?? categories[0],
      archived: !!p.archived
    }
  }

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await apiFetch('/api/posts?limit=100')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.posts
        setPosts((list ?? []).map(mapToEnhancedPost))
      } else {
        setErrorMessage('Failed to load posts. Please try again.')
      }
    } catch (err) {
      setErrorMessage('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Auto slug + SEO for create
  const [formData, setFormData] = useState<PostFormData>({
    title: '', slug: '', excerpt: '', content: '', tags: '', featured: false, published: false,
    seoTitle: '', seoDescription: '', category: categories[0], priority: 'medium', reviewRequired: false
  })

  useEffect(() => {
    if (formData.title && !selectedPost) {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
      const seoTitle = formData.seoTitle || `${formData.title} | Professional Accounting Services`
      setFormData(prev => ({ ...prev, slug, seoTitle: prev.seoTitle || seoTitle }))
    }
  }, [formData.title, selectedPost, formData.seoTitle])

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (post.author?.name?.toLowerCase().includes(q) ?? false)

      const matchesStatus = statusFilter === 'all' || post.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || post.priority === priorityFilter
      const matchesCompliance = complianceFilter === 'all' ||
        (complianceFilter === 'compliant' && post.isCompliant) ||
        (complianceFilter === 'non-compliant' && !post.isCompliant)

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesCompliance
    })

    filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string
      switch (sortBy) {
        case 'lastModified':
          aValue = new Date(a.lastModified || 0).getTime()
          bValue = new Date(b.lastModified || 0).getTime()
          break
        case 'publishedAt':
          aValue = new Date(a.publishedAt || 0).getTime()
          bValue = new Date(b.publishedAt || 0).getTime()
          break
        case 'views':
          aValue = a.views || 0
          bValue = b.views || 0
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }
      if (sortOrder === 'asc') return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    })

    return filtered
  }, [posts, searchQuery, statusFilter, categoryFilter, priorityFilter, complianceFilter, sortBy, sortOrder])

  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'published').length
    const drafts = posts.filter(p => p.status === 'draft').length
    const featured = posts.filter(p => p.featured).length
    const needsReview = posts.filter(p => p.reviewRequired).length
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)
    return { published, drafts, featured, needsReview, totalViews, total: posts.length }
  }, [posts])

  const validateForm = (data: PostFormData): ValidationError[] => {
    const errors: ValidationError[] = []
    if (!data.title.trim()) errors.push({ field: 'title', message: 'Title is required' })
    if (!data.slug.trim()) errors.push({ field: 'slug', message: 'Slug is required' })
    else if (!/^[a-z0-9-]+$/.test(data.slug)) errors.push({ field: 'slug', message: 'Use lowercase letters, numbers, and hyphens' })
    if (!data.content.trim()) errors.push({ field: 'content', message: 'Content is required' })
    else if (data.content.length < 100) errors.push({ field: 'content', message: 'Content should be at least 100 characters' })
    if (data.seoTitle && data.seoTitle.length > 60) errors.push({ field: 'seoTitle', message: 'SEO title should be less than 60 characters' })
    if (data.seoDescription && data.seoDescription.length > 160) errors.push({ field: 'seoDescription', message: 'SEO description should be less than 160 characters' })
    return errors
  }

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setErrorMessage('Please select a valid image file'); return }
    if (file.size > 5 * 1024 * 1024) { setErrorMessage('Image file size should be less than 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const fr = ev.target as FileReader
      setImagePreview((fr.result as string) || null)
    }
    reader.readAsDataURL(file)
    setFormData(prev => ({ ...prev, coverImage: file }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      title: '', slug: '', excerpt: '', content: '', tags: '', featured: false, published: false,
      seoTitle: '', seoDescription: '', category: categories[0], priority: 'medium', reviewRequired: false
    })
    setImagePreview(null)
    setValidationErrors([])
  }, [])

  const handleEdit = useCallback((post: Post) => {
    setSelectedPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      tags: post.tags.join(', '),
      featured: post.featured,
      published: post.published,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      category: post.category || categories[0],
      priority: post.priority,
      reviewRequired: post.reviewRequired || false
    })
    if (post.coverImage) setImagePreview(post.coverImage)
    setValidationErrors([])
    setShowEditModal(true)
  }, [])

  const handleCreate = useCallback(async () => {
    const errors = validateForm(formData)
    if (errors.length > 0) { setValidationErrors(errors); return }
    setSaving(true)
    setValidationErrors([])
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: formData.featured,
        published: formData.published,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined
      } as const
      const res = await apiFetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        setSuccessMessage('Post created successfully!')
        setShowCreateModal(false)
        resetForm()
        await loadPosts()
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMessage(err.error || 'Failed to create post')
      }
    } catch {
      setErrorMessage('Network error. Please try again.')
    } finally { setSaving(false) }
  }, [formData, loadPosts, resetForm])

  const handleUpdate = useCallback(async () => {
    if (!selectedPost) return
    const errors = validateForm(formData)
    if (errors.length > 0) { setValidationErrors(errors); return }
    setSaving(true)
    setValidationErrors([])
    try {
      const payload = {
        title: formData.title,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: formData.featured,
        published: formData.published,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined
      } as const
      const res = await apiFetch(`/api/posts/${encodeURIComponent(selectedPost.slug)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        setSuccessMessage('Post updated successfully!')
        setShowEditModal(false)
        setSelectedPost(null)
        resetForm()
        await loadPosts()
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMessage(err.error || 'Failed to update post')
      }
    } catch {
      setErrorMessage('Network error. Please try again.')
    } finally { setSaving(false) }
  }, [selectedPost, formData, loadPosts, resetForm])

  const handleDelete = useCallback(async () => {
    if (!selectedPost) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/posts/${encodeURIComponent(selectedPost.slug)}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccessMessage('Post deleted successfully!')
        setShowDeleteModal(false)
        setSelectedPost(null)
        await loadPosts()
      } else {
        const err = await res.json().catch(() => ({}))
        setErrorMessage(err.error || 'Failed to delete post')
      }
    } catch {
      setErrorMessage('Network error. Please try again.')
    } finally { setSaving(false) }
  }, [selectedPost, loadPosts])

  useEffect(() => { if (successMessage) { const t = setTimeout(() => setSuccessMessage(null), 5000); return () => clearTimeout(t) } }, [successMessage])
  useEffect(() => { if (errorMessage) { const t = setTimeout(() => setErrorMessage(null), 5000); return () => clearTimeout(t) } }, [errorMessage])

  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', value: statusFilter, options: [
      { value: 'all', label: 'All' },
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'archived', label: 'Archived' }
    ]},
    { key: 'category', label: 'Category', value: categoryFilter, options: [
      { value: 'all', label: 'All' },
      ...categories.map(c => ({ value: c, label: c }))
    ]},
    { key: 'priority', label: 'Priority', value: priorityFilter, options: [
      { value: 'all', label: 'All' },
      ...priorities.map(p => ({ value: p.value, label: p.label }))
    ]},
    { key: 'compliance', label: 'Compliance', value: complianceFilter, options: [
      { value: 'all', label: 'All' },
      { value: 'compliant', label: 'Compliant' },
      { value: 'non-compliant', label: 'Non-Compliant' }
    ]},
    { key: 'sort', label: 'Sort By', value: sortBy, options: [
      { value: 'lastModified', label: 'Last Modified' },
      { value: 'publishedAt', label: 'Published Date' },
      { value: 'views', label: 'Views' },
      { value: 'title', label: 'Title' }
    ]},
    { key: 'order', label: 'Order', value: sortOrder, options: [
      { value: 'desc', label: 'Desc' },
      { value: 'asc', label: 'Asc' }
    ]}
  ]

  const onFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value as any)
    if (key === 'category') setCategoryFilter(value)
    if (key === 'priority') setPriorityFilter(value as any)
    if (key === 'compliance') setComplianceFilter(value as any)
    if (key === 'sort') setSortBy(value as any)
    if (key === 'order') setSortOrder(value as any)
  }

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6 text-gray-700">You do not have access to Posts.</div>}>
      <StandardPage
      title="Posts"
      subtitle="Professional blog post management for your accounting firm"
      primaryAction={{ label: 'Create Post', onClick: () => setShowCreateModal(true), icon: Plus }}
      secondaryActions={[
        { label: 'Refresh', icon: RefreshCw, onClick: () => loadPosts(), disabled: loading },
        { label: 'Export CSV', icon: Download, onClick: () => { window.location.href = '/api/admin/export?entity=posts' } }
      ]}
      filters={filters}
      onFilterChange={onFilterChange}
      onSearch={(val) => setSearchQuery(val)}
      searchPlaceholder="Search posts..."
      loading={loading}
    >
      {successMessage && (
        <div role="status" aria-live="polite" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
          <button aria-label="Dismiss success message" onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{errorMessage}</span>
          <button aria-label="Dismiss error message" onClick={() => setErrorMessage(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PostStats
        published={stats.published}
        drafts={stats.drafts}
        featured={stats.featured}
        needsReview={stats.needsReview}
        totalViews={stats.totalViews}
      />

      <div role="list" aria-label="Posts" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={handleEdit}
            onDelete={(p) => { setSelectedPost(p); setShowDeleteModal(true) }}
            onPreview={(p) => { setSelectedPost(p); setShowPreviewModal(true) }}
            onView={(p) => window.open(`/blog/${p.slug}`, '_blank')}
          />
        ))}
      </div>

      {filteredAndSortedPosts.length === 0 && !loading && (
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No posts match your criteria</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {posts.length === 0 ? 'Get started by creating your first professional blog post.' : 'Try adjusting your filters or search terms to find what you\'re looking for.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
            {posts.length > 0 && (
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); setPriorityFilter('all'); setComplianceFilter('all') }}>
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Blog Post</DialogTitle>
            <DialogDescription>Create professional content for your accounting firm&apos;s blog</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter post title..." className={validationErrors.find(e => e.field==='title') ? 'border-red-500' : ''} />
                {validationErrors.find(e => e.field==='title') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='title')?.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">/blog/</span>
                  <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="post-url-slug" className={`rounded-l-none ${validationErrors.find(e => e.field==='slug') ? 'border-red-500' : ''}`} />
                </div>
                {validationErrors.find(e => e.field==='slug') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='slug')?.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief description for search engines and social media..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <textarea value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} placeholder="Write your professional blog content here..." rows={16} className={`w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm ${validationErrors.find(e => e.field==='content') ? 'border-red-500' : ''}`} />
                {validationErrors.find(e => e.field==='content') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='content')?.message}</p>)}
                <p className="text-xs text-gray-500 mt-1">{formData.content.split(' ').filter(w => w.length > 0).length} words</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Publishing</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="published" checked={formData.published} onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))} className="rounded" />
                    <label htmlFor="published" className="text-sm text-gray-700">Publish immediately</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="rounded" />
                    <label htmlFor="featured" className="text-sm text-gray-700">Featured post</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="reviewRequired" checked={formData.reviewRequired} onChange={(e) => setFormData(prev => ({ ...prev, reviewRequired: e.target.checked }))} className="rounded" />
                    <label htmlFor="reviewRequired" className="text-sm text-gray-700">Requires review before publishing</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <Image src={imagePreview} alt="Preview" width={800} height={320} className="w-full h-40 object-cover rounded" />
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, coverImage: null })) }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Upload a professional cover image</p>
                      <p className="text-xs text-gray-500 mb-3">Recommended: 1200x600px, under 5MB</p>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" id="coverImage" />
                      <label htmlFor="coverImage" className="cursor-pointer">
                        <Button type="button" size="sm" variant="outline">
                          <Upload className="h-3 w-3 mr-1" />
                          Choose Image
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as PostPriority }))} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {priorities.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <Input value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="accounting, tax-planning, small-business" />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">SEO Optimization</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">SEO Title</label>
                    <Input value={formData.seoTitle} onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))} placeholder="SEO optimized title (50-60 chars)" className="text-sm" maxLength={60} />
                    <p className="text-xs text-gray-500 mt-1">{formData.seoTitle.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Meta Description</label>
                    <textarea value={formData.seoDescription} onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))} placeholder="Compelling meta description for search results..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    <p className="text-xs text-gray-500 mt-1">{formData.seoDescription.length}/160 characters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>{validationErrors.length > 0 && (<p className="text-red-500 text-sm">Please fix {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''} above</p>)}</div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>) : (<><Save className="h-4 w-4 mr-2" />Create Post</>)}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Blog Post</DialogTitle>
            <DialogDescription>Update your professional blog content</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className={validationErrors.find(e => e.field==='title') ? 'border-red-500' : ''} />
                {validationErrors.find(e => e.field==='title') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='title')?.message}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">/blog/</span>
                  <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} className={`rounded-l-none ${validationErrors.find(e => e.field==='slug') ? 'border-red-500' : ''}`} />
                </div>
                {validationErrors.find(e => e.field==='slug') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='slug')?.message}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} rows={3} maxLength={160} className="w-full px-3 py-2 border border-gray-200 rounded-md" />
                <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/160 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                <textarea value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))} rows={16} className={`w-full px-3 py-2 border border-gray-200 rounded-md font-mono text-sm ${validationErrors.find(e => e.field==='content') ? 'border-red-500' : ''}`} />
                {validationErrors.find(e => e.field==='content') && (<p className="text-red-500 text-xs mt-1">{validationErrors.find(e => e.field==='content')?.message}</p>)}
                <p className="text-xs text-gray-500 mt-1">{formData.content.split(' ').filter(w => w.length > 0).length} words</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Publishing</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="editPublished" checked={formData.published} onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))} className="rounded" />
                    <label htmlFor="editPublished" className="text-sm text-gray-700">Publish immediately</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="editFeatured" checked={formData.featured} onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="rounded" />
                    <label htmlFor="editFeatured" className="text-sm text-gray-700">Featured post</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="editReviewRequired" checked={formData.reviewRequired} onChange={(e) => setFormData(prev => ({ ...prev, reviewRequired: e.target.checked }))} className="rounded" />
                    <label htmlFor="editReviewRequired" className="text-sm text-gray-700">Requires review before publishing</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <Image src={imagePreview} alt="Preview" width={800} height={320} className="w-full h-40 object-cover rounded" />
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, coverImage: null })) }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Upload a professional cover image</p>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" id="editCoverImage" />
                      <label htmlFor="editCoverImage" className="cursor-pointer">
                        <Button type="button" size="sm" variant="outline">
                          <Upload className="h-3 w-3 mr-1" />
                          Choose Image
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as PostPriority }))} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {priorities.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <Input value={formData.tags} onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="accounting, tax-planning, small-business" />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">SEO Optimization</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">SEO Title</label>
                    <Input value={formData.seoTitle} onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))} placeholder="SEO optimized title" className="text-sm" maxLength={60} />
                    <p className="text-xs text-gray-500 mt-1">{formData.seoTitle.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Meta Description</label>
                    <textarea value={formData.seoDescription} onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))} placeholder="Meta description for search results..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                    <p className="text-xs text-gray-500 mt-1">{formData.seoDescription.length}/160 characters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>{validationErrors.length > 0 && (<p className="text-red-500 text-sm">Please fix {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''} above</p>)}</div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedPost(null); resetForm() }} disabled={saving}>Cancel</Button>
              <Button onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>) : (<><Save className="h-4 w-4 mr-2" />Update Post</>)}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
            <DialogDescription>Preview how this post will appear on your blog</DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="prose max-w-none">
              {selectedPost.coverImage && (
                <Image src={selectedPost.coverImage} alt={selectedPost.title} width={1200} height={600} className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedPost.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>By {selectedPost.author?.name}</span>
                  <span>•</span>
                  <span>{selectedPost.readTime ?? 0} min read</span>
                  <span>•</span>
                  <span>{selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedPost.tags.map(tag => (<Badge key={tag} variant="outline">{tag}</Badge>))}
                </div>
              </div>
              {selectedPost.excerpt && (
                <div className="text-lg text-gray-600 mb-6 italic border-l-4 border-purple-500 pl-4">{selectedPost.excerpt}</div>
              )}
              <div className="prose-gray text-gray-800 whitespace-pre-wrap">{selectedPost.content}</div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Close Preview</Button>
            {selectedPost && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => window.open(`/blog/${selectedPost.slug}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2 inline" />
                View Live
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPost?.title}&quot;? This action cannot be undone and will permanently remove the post and all its associated data.
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm space-y-2">
                <div><strong>Title:</strong> {selectedPost.title}</div>
                <div><strong>Views:</strong> {selectedPost.views?.toLocaleString() || 0}</div>
                <div><strong>Status:</strong> {selectedPost.status}</div>
                <div><strong>Last Modified:</strong> {selectedPost.lastModified ? new Date(selectedPost.lastModified).toLocaleDateString() : ''}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>) : (<><AlertCircle className="h-4 w-4 mr-2" />Delete Post</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardPage>
    </PermissionGate>
  )
}
