import { disconnectPrisma, resolveTenantId, runWithTenantRLSContext } from './tenant-rls-utils'

async function main() {
  const tenantId = resolveTenantId({ defaultValue: 'tenant_primary' })

  const { pendingMessages, remainingNullCount } = await runWithTenantRLSContext(tenantId, async (tx) => {
    const pending = await tx.$queryRaw<any>`SELECT id, "userId", room, text, "createdAt" FROM chat_messages WHERE "tenantId" IS NULL`
    if (!pending.length) {
      return { pendingMessages: [], remainingNullCount: 0 }
    }

    await tx.$executeRawUnsafe(`UPDATE chat_messages SET "tenantId" = $1 WHERE "tenantId" IS NULL`, tenantId)
    const [{ count }] = await tx.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM chat_messages WHERE "tenantId" IS NULL`
    )

    return { pendingMessages: pending, remainingNullCount: Number(count) }
  })

  if (pendingMessages.length === 0) {
    console.log('No chat_messages require tenant assignment. All rows already scoped.')
  } else {
    console.log('Assigned tenant to chat_messages:', pendingMessages.map((m: any) => m.id))
    console.log('Remaining NULL tenant rows:', remainingNullCount)
  }

  await disconnectPrisma()
}

main().catch((error) => {
  console.error(error)
  disconnectPrisma().finally(() => process.exit(1))
})
