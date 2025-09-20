import { captureErrorIfAvailable } from '@/lib/observability-helpers'

type StoreLike = any

async function loadNetlifyStore(): Promise<StoreLike | null> {
  try {
    const dynamicImport = (s: string) => (Function('x', 'return import(x)'))(s) as Promise<any>
    const mod = await dynamicImport('@netlify/blobs').catch(() => null as any)
    if (!mod) return null
    const Blobs = mod.Blobs || mod.default || mod
    const token = process.env.NETLIFY_BLOBS_TOKEN
    if (!token) return null
    return new Blobs({ token })
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'uploads-provider', step: 'load-netlify' })
    return null
  }
}

async function getStore() {
  const provider = (process.env.UPLOADS_PROVIDER || '').toLowerCase()
  switch (provider) {
    case 'netlify': {
      const store = await loadNetlifyStore()
      return { name: 'netlify', store }
    }
    case 'supabase': {
      // Not implemented here; expect deployment to provide provider helpers
      return { name: 'supabase', store: null }
    }
    default:
      return { name: 'none', store: null }
  }
}

export async function listQuarantine(prefix = 'quarantine/') {
  const { name, store } = await getStore()
  if (name !== 'netlify' || !store || typeof store.list !== 'function') return []
  try {
    const items = await store.list({ prefix })
    return Array.isArray(items) ? items : []
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'uploads-provider', step: 'list', prefix })
    return []
  }
}

export async function getObject(key: string) {
  const { name, store } = await getStore()
  if (!store || typeof store.get !== 'function') return null
  try {
    const data = await store.get(key).catch(() => null)
    return data || null
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'uploads-provider', step: 'get', key })
    return null
  }
}

export async function putObject(key: string, data: Buffer | Uint8Array, opts: any = {}) {
  const { name, store } = await getStore()
  if (!store || typeof store.set !== 'function') throw new Error('store not available')
  try {
    await store.set(key, data, opts)
    return true
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'uploads-provider', step: 'put', key })
    throw e
  }
}

export async function removeObject(key: string) {
  const { name, store } = await getStore()
  if (!store || typeof store.remove !== 'function') throw new Error('remove not supported')
  try {
    await store.remove(key)
    return true
  } catch (e) {
    await captureErrorIfAvailable(e, { route: 'uploads-provider', step: 'remove', key })
    throw e
  }
}

export async function moveToQuarantine(key: string) {
  const quarantineKey = `quarantine/${key}`
  const data = await getObject(key)
  if (!data) return { ok: false, error: 'source_not_found' }
  try {
    await putObject(quarantineKey, data, {})
    try { await removeObject(key) } catch {}
    return { ok: true, key: quarantineKey }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function releaseFromQuarantine(key: string) {
  const publicKey = key.replace(/^quarantine\//, 'uploads/')
  const data = await getObject(key)
  if (!data) return { ok: false, error: 'source_not_found' }
  try {
    await putObject(publicKey, data, {})
    try { await removeObject(key) } catch {}
    return { ok: true, key: publicKey }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function getPublicUrl(key: string) {
  const { name, store } = await getStore()
  if (!store) return undefined
  try {
    if (typeof store.getPublicUrl === 'function') return store.getPublicUrl(key)
    return undefined
  } catch {
    return undefined
  }
}
