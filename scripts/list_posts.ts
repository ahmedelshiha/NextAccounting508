import prisma from '../src/lib/prisma'
import type { Post } from '@prisma/client'

async function main() {
  const posts: Post[] = await prisma.post.findMany({ take: 20 })
  console.log('DB posts:', posts.map((p: Post) => ({ id: p.id, slug: p.slug, title: p.title, published: p.published })))
}

main().catch(e => { console.error(e); process.exit(1) })
