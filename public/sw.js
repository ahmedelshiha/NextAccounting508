const CACHE_NAME = 'af-cache-v1'
const CACHE_NAME = 'booking-system-v2'
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

  // Stale-while-revalidate for specific APIs (including bookings GET)
  if (req.method === 'GET' && (url.pathname === '/api/services' || url.pathname.startsWith('/api/portal/service-requests') || url.pathname.startsWith('/api/bookings') || url.pathname.startsWith('/api/portal/service-requests'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req).then((res) => { try { cache.put(req, res.clone()) } catch {} ; return res }).catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // For POST to /api/bookings, try network then fallback to offline response (client queues request)
  if (req.method === 'POST' && url.pathname === '/api/bookings') {
    event.respondWith(
      fetch(req).catch(() => new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    )
    return
  }
})
