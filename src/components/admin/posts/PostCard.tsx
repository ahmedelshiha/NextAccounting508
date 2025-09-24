"use client"

import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Archive, Calendar, CheckCircle, Edit, Eye, ExternalLink, Globe, Star, Tag } from 'lucide-react'
import type { Post, PostPriority, PostStatus } from './types'

interface PostCardProps {
  post: Post
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
  onPreview: (post: Post) => void
  onView: (post: Post) => void
}

const priorityStyles: Record<PostPriority, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium Priority', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'High Priority', className: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
}

function StatusBadge({ status }: { status: PostStatus }) {
  switch (status) {
    case 'published':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Published
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      )
    case 'scheduled':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Calendar className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Edit className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      )
  }
}

export default function PostCard({ post, onEdit, onDelete, onPreview, onView }: PostCardProps) {
  const priority = priorityStyles[post.priority]

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative">
      {post.priority === 'urgent' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}

      {post.coverImage && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <Image src={post.coverImage} alt={post.title} width={1200} height={480} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {post.featured && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {post.reviewRequired && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Review
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 right-3">
            <Badge className={priority.className}>{priority.label}</Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-1">{post.title}</CardTitle>
            <CardDescription className="text-xs text-gray-500 flex items-center">
              <Globe className="h-3 w-3 mr-1" />/{post.slug}
            </CardDescription>
          </div>
          <StatusBadge status={post.status} />
        </div>
        {post.excerpt && <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            {post.author && (
              <div className="flex items-center">
                <Edit className="h-3 w-3 mr-1" />
                <span className="font-medium">{post.author.name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              v{post.version}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {post.isCompliant ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {post.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">+{post.tags.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            {typeof post.views === 'number' && (
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {post.views.toLocaleString()}
              </div>
            )}
            {post.readTime && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {post.readTime}min
              </div>
            )}
          </div>
          {post.wordCount && (
            <div className="text-xs text-gray-400">{post.wordCount.toLocaleString()} words</div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(post)} className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(post)} className="text-red-600 hover:text-red-700 text-xs">
              <AlertCircle className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="text-xs px-2 py-1 text-gray-600 hover:text-purple-600 border border-gray-200 rounded hover:border-purple-200 transition-colors" onClick={() => onPreview(post)}>
              <Eye className="h-3 w-3 mr-1 inline" />
              Preview
            </button>
            <button className="text-xs px-2 py-1 text-gray-600 hover:text-blue-600 border border-gray-200 rounded hover:border-blue-200 transition-colors" onClick={() => onView(post)}>
              <ExternalLink className="h-3 w-3 mr-1 inline" />
              View
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
          Last modified: {post.lastModified ? new Date(post.lastModified).toLocaleDateString() : '—'}
          {post.approvedBy && (<span className="ml-2">• Approved by {post.approvedBy}</span>)}
        </div>
      </CardContent>
    </Card>
  )
}
