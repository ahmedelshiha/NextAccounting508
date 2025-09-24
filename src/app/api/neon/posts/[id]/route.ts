import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@netlify/neon'
let sql: any = null
try {
  sql = neon()
} catch (e) {
  // Best-effort: if no NETLIFY_DATABASE_URL is configured (local dev), don't throw at import time.
  // The route will return an error response when executed without a DB.
  // This avoids build-time failures when the environment variable isn't present.
   
  console.warn('Neon client not initialized (NETLIFY_DATABASE_URL missing?):', e)
}

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

export async function GET(_req: Request, ctx: any) {
  try {
    const params = ctx?.params || ctx
    const { id } = params && params.params ? await params.params : (params || {})
    if (!sql) {
      console.warn('Neon client not available; returning null post')
      return new Response(JSON.stringify(null), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    const rows = (await sql`SELECT * FROM "Post" WHERE id = ${id} LIMIT 1`) as unknown as PostRow[]
    const post: PostRow | null = rows[0] ?? null
    return new Response(JSON.stringify(post), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Neon GET /api/neon/posts/[id] error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch post' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
