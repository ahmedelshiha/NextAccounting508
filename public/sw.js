const CACHE_NAME = 'af-cache-v1'
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
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

  // Stale-while-revalidate for specific APIs
  if (req.method === 'GET' && (url.pathname === '/api/services' || url.pathname.startsWith('/api/portal/service-requests'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req).then((res) => { cache.put(req, res.clone()); return res }).catch(() => cached)
        return cached || network
      })
    )
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
  try {
    const items = await getAllQueued(db)
    for (const item of items) {
      try {
        const res = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body) })
        if (res && res.ok) await removeQueued(db, item.id)
        else if (res && res.status >= 400 && res.status < 500) await removeQueued(db, item.id)
      } catch {
        // keep in queue for next sync
      }
    }
  } finally {
    try { db.close() } catch {}
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'service-requests-sync') {
    event.waitUntil(processQueue())
  }
})
