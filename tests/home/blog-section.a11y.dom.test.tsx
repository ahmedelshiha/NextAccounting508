import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import BlogCard from '@/components/home/BlogCard'
import { BlogSection } from '@/components/home/blog-section'

vi.mock('@/lib/prisma', () => ({ default: { post: { findMany: async () => [] } } }))

describe('Blog section a11y', () => {
  it('section is a labeled region', async () => {
    const html = renderToStaticMarkup(await BlogSection())
    expect(/role="region"/.test(html)).toBe(true)
    expect(/aria-labelledby="home-blog-heading"/.test(html)).toBe(true)
    expect(/id="home-blog-heading"/.test(html)).toBe(true)
  })

  it('blog card exposes article role and labeled title/link', () => {
    const html = renderToStaticMarkup(
      <BlogCard post={{ id: 'p1', title: 'Hello Tax Planning', slug: 'hello', excerpt: 'x', publishedAt: new Date('2024-01-01'), createdAt: new Date('2024-01-01'), readTime: 5, tags: [], author: { name: 'Author', image: null } }} />
    )
    expect(/role="article"/.test(html)).toBe(true)
    expect(/aria-labelledby="post-p1-title"/.test(html)).toBe(true)
    expect(/id="post-p1-title"/.test(html)).toBe(true)
    expect(/aria-label="Read more: Hello Tax Planning"/.test(html)).toBe(true)
  })
})
