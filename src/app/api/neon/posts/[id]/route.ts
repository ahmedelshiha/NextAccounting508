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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const rows = await sql<PostRow[]>`SELECT * FROM "Post" WHERE id = ${id} LIMIT 1`
    const post = rows[0] ?? null
    return NextResponse.json(post)
  } catch (error) {
    console.error('Neon GET /api/neon/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}
