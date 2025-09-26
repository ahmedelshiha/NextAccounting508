const CACHE_NAME = 'booking-system-v3'
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(PRECACHE_URLS)
    } finally {
      try { await self.skipWaiting() } catch {}
    }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle same-origin requests
  if (url.origin !== location.origin) return

  // Cache-first for static assets
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image' || url.pathname.startsWith('/_next')) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
        return res
      }))
    )
    return
  }

  // Network-first for navigations
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/'))
    )
    return
  }

  // Stale-while-revalidate for specific APIs (including bookings GET)
  if (req.method === 'GET' && (url.pathname.startsWith('/api/services') || url.pathname.startsWith('/api/portal/service-requests') || url.pathname.startsWith('/api/bookings'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req).then((res) => { try { cache.put(req, res.clone()) } catch {} ; return res }).catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // For POST to /api/bookings, try network then fallback to offline enqueue + 202 ack
  if (req.method === 'POST' && (url.pathname === '/api/bookings' || url.pathname === '/api/portal/service-requests')) {
    event.respondWith((async () => {
      try {
        return await fetch(req)
      } catch {
        try {
          const body = await req.clone().json().catch(() => null)
          if (body) {
            // Enqueue into IndexedDB for Background Sync
            const DB_NAME = 'af-offline'
            const STORE = 'service-requests-queue'
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
            const idempotencyKey = `sr-${id}`
            await new Promise((resolve, reject) => {
              const open = indexedDB.open(DB_NAME, 1)
              open.onupgradeneeded = () => {
                const db = open.result
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
              }
              open.onsuccess = () => {
                const db = open.result
                const tx = db.transaction(STORE, 'readwrite')
                tx.oncomplete = () => { try { db.close() } catch {} ; resolve(true) }
                tx.onerror = () => { try { db.close() } catch {} ; reject(tx.error) }
                tx.objectStore(STORE).put({ id, url: url.pathname, body, createdAt: Date.now(), retries: 0, idempotencyKey })
              }
              open.onerror = () => reject(open.error)
            })

            // Request a background sync if available
            try { const reg = await self.registration; if ('sync' in reg) { /* @ts-expect-error - Background Sync API typing is missing in TS DOM lib for ServiceWorkerRegistration */ await reg.sync.register('service-requests-sync') } } catch {}
          }
        } catch {}
        return new Response(JSON.stringify({ offline: true, queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } })
      }
    })())
    return
  }
})

// Background Sync: process queued service requests when back online
const DB_NAME = 'af-offline'
const STORE = 'service-requests-queue'

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getAllQueued(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const items = []
    const cursor = store.openCursor()
    cursor.onsuccess = (e) => {
      const c = e.target.result
      if (c) { items.push(c.value); c.continue() } else { resolve(items) }
    }
    cursor.onerror = () => reject(cursor.error)
  })
}

function removeQueued(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).delete(id)
  })
}

async function processQueue() {
  let db
  try { db = await openQueueDB() } catch { return }

  function backoffDelay(retries) {
    const base = 5000
    const factor = 2
    const max = 5 * 60 * 1000
    const jitterRatio = 0.2
    const exp = Math.pow(factor, Math.max(0, retries))
    const raw = Math.min(max, Math.floor(base * exp))
    const jitter = Math.floor(raw * jitterRatio)
    const sign = Math.random() < 0.5 ? -1 : 1
    return Math.max(0, raw + sign * Math.floor(Math.random() * (jitter + 1)))
  }

  function markForRetry(db, item, status) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        const retries = (item.retries || 0) + 1
        const maxRetries = 8
        if (retries > maxRetries) {
          // drop after max retries
          store.delete(item.id)
        } else {
          const nextAttemptAt = Date.now() + backoffDelay(retries)
          store.put({ ...item, retries, nextAttemptAt, lastStatus: status })
        }
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
        tx.onabort = () => resolve(false)
      } catch { resolve(false) }
    })
  }

  try {
    const items = await getAllQueued(db)
    for (const item of items) {
      try {
        if (item.nextAttemptAt && Date.now() < item.nextAttemptAt) continue
        const headers = new Headers({ 'Content-Type': 'application/json' })
        if (item.idempotencyKey) headers.set('x-idempotency-key', item.idempotencyKey)
        const res = await fetch(item.url, { method: 'POST', headers, body: JSON.stringify(item.body) })
        if (res && res.ok) {
          await removeQueued(db, item.id)
        } else if (res && res.status >= 400 && res.status < 500) {
          // Non-retriable client errors removed, except 408/425/429 which are retriable
          if (res.status === 408 || res.status === 425 || res.status === 429) {
            await markForRetry(db, item, res.status)
          } else {
            await removeQueued(db, item.id)
          }
        } else {
          await markForRetry(db, item, res ? res.status : 0)
        }
      } catch {
        await markForRetry(db, item, 0)
      }
    }
  } finally {
    try { if (db && typeof db.close === 'function') { db.close() } } catch {}
  }
}

self.addEventListener('sync', (event) => {
  try {
    if (event && typeof event === 'object' && 'tag' in event && event.tag === 'service-requests-sync') {
      event.waitUntil(processQueue())
    }
  } catch {}
})
