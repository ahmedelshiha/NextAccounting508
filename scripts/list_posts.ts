import { prisma } from '../src/lib/prisma'

async function main() {
  const posts = await prisma.post.findMany({ take: 20 })
  console.log('DB posts:', posts.map(p => ({ id: p.id, slug: p.slug, title: p.title, published: p.published })))
}

main().catch(e => { console.error(e); process.exit(1) })
