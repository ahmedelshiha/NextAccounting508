import type { Post } from '@prisma/client'
import { resolveTenantId, runWithTenantRLSContext, disconnectPrisma } from './tenant-rls-utils'

async function main() {
  const tenantId = resolveTenantId({ required: true })

  const posts: Post[] = await runWithTenantRLSContext(tenantId, async (tx: any) => {
    return tx.post.findMany({ take: 20, orderBy: { createdAt: 'desc' } }) as Promise<Post[]>
  })

  console.log(`DB posts for tenant ${tenantId}:`, posts.map((p: Post) => ({ id: p.id, slug: p.slug, title: p.title, published: p.published })))
}

main()
  .catch((e: unknown) => { console.error(e); process.exit(1) })
  .finally(async () => { await disconnectPrisma() })
