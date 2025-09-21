// Lightweight IndexedDB-backed queue for offline service request submissions
// Provides: queueServiceRequest, processQueuedServiceRequests, registerBackgroundSync, isOnline

export type QueuedServiceRequest = {
  id: string
  url: string
  body: any
  createdAt: number
  retries: number
}

const DB_NAME = 'af-offline'
const STORE = 'service-requests-queue'
const SYNC_TAG = 'service-requests-sync'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('indexedDB unavailable'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('indexedDB open error'))
  })
}

function putItem(db: IDBDatabase, item: QueuedServiceRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('tx error'))
    tx.objectStore(STORE).put(item)
  })
}

function getAll(db: IDBDatabase): Promise<QueuedServiceRequest[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const items: QueuedServiceRequest[] = []
    const req = store.openCursor()
    req.onsuccess = () => {
      const c = req.result as IDBCursorWithValue | null
      if (c) { items.push(c.value as QueuedServiceRequest); c.continue() } else { resolve(items) }
    }
    req.onerror = () => reject(req.error || new Error('cursor error'))
  })
}

function remove(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('tx error'))
    tx.objectStore(STORE).delete(id)
  })
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function queueServiceRequest(body: any, url = '/api/portal/service-requests') {
  const db = await openDB()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const item: QueuedServiceRequest = { id, url, body, createdAt: Date.now(), retries: 0 }
  await putItem(db, item)
  try { db.close() } catch {}
  return id
}

export async function processQueuedServiceRequests() {
  try {
    const db = await openDB()
    const items = await getAll(db)
    for (const item of items) {
      try {
        const res = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body) })
        if (res.ok) {
          await remove(db, item.id)
        } else if (res.status >= 400 && res.status < 500) {
          // do not retry client errors
          await remove(db, item.id)
        }
      } catch {
        // network error: keep for next round
      }
    }
    try { db.close() } catch {}
  } catch {
    // ignore if db not available
  }
}

export async function registerBackgroundSync() {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    if ('sync' in reg) {
      // @ts-ignore
      await reg.sync.register(SYNC_TAG)
      return true
    }
  } catch {}
  return false
}
