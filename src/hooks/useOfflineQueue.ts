import { useEffect, useState, useCallback } from 'react'
import { processQueuedServiceRequests } from '@/lib/offline-queue'

const DB_NAME = 'af-offline'
const STORE = 'service-requests-queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    } catch (e) {
      reject(e)
    }
  })
}

async function countQueued(): Promise<number> {
  try {
    const db = await openDB()
    return await new Promise<number>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE, 'readonly')
        const store = tx.objectStore(STORE)
        const req = store.count()
        req.onsuccess = () => resolve(Number(req.result || 0))
        req.onerror = () => reject(req.error)
      } catch (e) {
        reject(e)
      }
    }).finally(() => { try { db.close() } catch {} })
  } catch {
    return 0
  }
}

export function useOfflineQueue(pollInterval = 10_000) {
  const [queuedCount, setQueuedCount] = useState<number>(0)

  const refresh = useCallback(async () => {
    const n = await countQueued().catch(() => 0)
    setQueuedCount(n)
  }, [])

  const processQueue = useCallback(async () => {
    await processQueuedServiceRequests().catch(() => {})
    await refresh()
  }, [refresh])

  useEffect(() => {
    refresh()
    if (typeof window !== 'undefined') {
      const onFocus = () => refresh()
      window.addEventListener('focus', onFocus)
      const interval = setInterval(refresh, pollInterval)
      return () => { window.removeEventListener('focus', onFocus); clearInterval(interval) }
    }
    return
  }, [refresh, pollInterval])

  return { queuedCount, refreshQueue: refresh, processQueue }
}
