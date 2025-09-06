import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@netlify/neon'

const sql = neon()

export type PostRow = {
  id: string
  slug: string
  title: string
  content: string | null
  excerpt: string | null
  published: boolean
  featured: boolean
  tags: string[] | null
  readTime: number | null
  coverImage: string | null
  views: number | null
  authorId: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | Date | null
  createdAt: string | Date
  updatedAt?: string | Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedParam = searchParams.get('published')
    const featuredParam = searchParams.get('featured')
    const limitParam = searchParams.get('limit')

    const limit = Math.max(1, Math.min(parseInt(limitParam || '20', 10) || 20, 100))
    const published = publishedParam === null ? null : publishedParam === 'true'
    const featured = featuredParam === null ? null : featuredParam === 'true'

    let rows: PostRow[] = []
    if (published !== null && featured !== null) {
      rows = await sql<PostRow[]>`SELECT * FROM "Post" WHERE published = ${published} AND featured = ${featured} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`
    } else if (published !== null) {
      rows = await sql<PostRow[]>`SELECT * FROM "Post" WHERE published = ${published} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`
    } else if (featured !== null) {
      rows = await sql<PostRow[]>`SELECT * FROM "Post" WHERE featured = ${featured} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`
    } else {
      rows = await sql<PostRow[]>`SELECT * FROM "Post" ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Neon GET /api/neon/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
