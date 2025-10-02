import { afterAll } from 'vitest'

const tenants = new Set<string>()

export function registerTenant(tenantId: string) {
  if (!tenantId) return
  tenants.add(tenantId)
}

async function cleanupAll() {
  if (!tenants.size) return
  const { cleanupTenant } = await import('../fixtures/tenantFixtures')
  for (const t of Array.from(tenants)) {
    try {
      await cleanupTenant(t)
    } catch (e) {
      // ignore individual errors
    }
  }
}

afterAll(async () => {
  try {
    await cleanupAll()
  } catch (e) {
    // ignore
  }
})

export function listRegisteredTenants() {
  return Array.from(tenants)
}
