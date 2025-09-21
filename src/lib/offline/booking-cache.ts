// Lightweight IndexedDB utility for offline booking cache
const DB_NAME = 'BookingSystemDB'
const DB_VERSION = 1
const PENDING_STORE = 'pendingBookings'
const SERVICES_STORE = 'services'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const s = db.createObjectStore(PENDING_STORE, { keyPath: 'id' })
        s.createIndex('createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains(SERVICES_STORE)) {
        const s = db.createObjectStore(SERVICES_STORE, { keyPath: 'id' })
        s.createIndex('cachedAt', 'cachedAt')
      }
    }
  })
}

export async function savePendingBooking(booking: any) {
  try {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)
    const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const record = { ...booking, id, status: 'PENDING_SYNC', createdAt: new Date().toISOString() }
    store.put(record)
    return await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }).catch(() => null)
  } catch (e) {
    console.error('savePendingBooking error', e)
    return null
  }
}

export async function getPendingBookings(): Promise<any[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readonly')
    const store = tx.objectStore(PENDING_STORE)
    const req = store.getAll()
    return await new Promise<any[]>((resolve) => { req.onsuccess = () => resolve(req.result); req.onerror = () => resolve([]) })
  } catch (e) {
    console.error('getPendingBookings error', e)
    return []
  }
}

export async function deletePendingBooking(id: string) {
  try {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)
    store.delete(id)
    return await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }).catch(() => null)
  } catch (e) {
    console.error('deletePendingBooking error', e)
  }
}

export async function flushPendingBookings(flushCallback?: (rec: any) => Promise<boolean>) {
  const items = await getPendingBookings()
  for (const item of items) {
    try {
      let ok = false
      if (flushCallback) ok = await flushCallback(item)
      else {
        // default behavior: try to POST to /api/bookings
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
        ok = res.ok
      }
      if (ok) await deletePendingBooking(item.id)
    } catch (e) {
      // leave it for next attempt
    }
  }
}

// Simple services cache for offline browsing
export async function cacheServices(services: any[]) {
  try {
    const db = await openDb()
    const tx = db.transaction(SERVICES_STORE, 'readwrite')
    const store = tx.objectStore(SERVICES_STORE)
    for (const s of services) {
      store.put({ ...s, cachedAt: new Date().toISOString() })
    }
    return await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch (e) { console.error('cacheServices', e) }
}

export async function getCachedServices(): Promise<any[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(SERVICES_STORE, 'readonly')
    const store = tx.objectStore(SERVICES_STORE)
    const req = store.getAll()
    return await new Promise<any[]>((resolve) => { req.onsuccess = () => resolve(req.result); req.onerror = () => resolve([]) })
  } catch (e) { return [] }
}
