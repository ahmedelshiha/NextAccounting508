export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type PostPriority = 'low' | 'medium' | 'high' | 'urgent'

export type AuthorInfo = {
  id: string
  name: string
  avatar?: string | null
  role?: string
}

export type Post = {
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
  updatedAt?: string | Date | null
  views?: number
  author?: AuthorInfo | null
  status: PostStatus
  priority: PostPriority
  lastModified?: string | Date | null
  wordCount?: number
  isCompliant?: boolean
  reviewRequired?: boolean
  approvedBy?: string
  version: number
  shares?: number
  comments?: number
  category?: string
  archived?: boolean
}
