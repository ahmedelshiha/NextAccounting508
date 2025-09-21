"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QueuedItem { id: string; url: string; body: any; createdAt: number; retries?: number; idempotencyKey?: string; nextAttemptAt?: number; lastStatus?: number }

export default function OfflineQueueInspector() {
  const [items, setItems] = useState<QueuedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [flushing, setFlushing] = useState(false)

  useEffect(() => {
    let ignore = false
    const DB_NAME = 'af-offline'
    const STORE = 'service-requests-queue'

    function openDB(): Promise<IDBDatabase> {
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

    async function load() {
      setLoading(true)
      try {
        const db = await openDB()
        const tx = db.transaction(STORE, 'readonly')
        const store = tx.objectStore(STORE)
        const req = store.getAll()
        await new Promise<void>((resolve) => { req.onsuccess = () => resolve(); req.onerror = () => resolve() })
        if (!ignore) setItems((req.result as any[]) || [])
        try { db.close() } catch {}
      } finally { if (!ignore) setLoading(false) }
    }

    load()
    const t = setInterval(load, 5000)
    return () => { ignore = true; clearInterval(t) }
  }, [])

  const triggerSync = async () => {
    setFlushing(true)
    try {
      const reg = await navigator.serviceWorker?.ready
      // Prefer Background Sync if available
      // @ts-ignore
      if (reg && 'sync' in reg) { try { /* @ts-ignore */ await reg.sync.register('service-requests-sync') } catch {} }
      // Also send a message to SW to process now
      try { navigator.serviceWorker.controller?.postMessage({ type: 'process-queue' }) } catch {}
    } finally { setTimeout(() => setFlushing(false), 800) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offline queue</CardTitle>
        <CardDescription>Queued submissions when offline. Automatically retries when back online.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">Queue is empty.</p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">{items.length} item(s) queued</div>
            <div className="max-h-60 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="text-left p-2">When</th>
                    <th className="text-left p-2">Endpoint</th>
                    <th className="text-left p-2">Idempotency</th>
                    <th className="text-left p-2">Retries</th>
                    <th className="text-left p-2">Next attempt</th>
                    <th className="text-left p-2">Last status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-t">
                      <td className="p-2">{new Date(it.createdAt).toLocaleString()}</td>
                      <td className="p-2 font-mono">{it.url}</td>
                      <td className="p-2 font-mono">{it.idempotencyKey || '-'}</td>
                      <td className="p-2">{it.retries ?? 0}</td>
                      <td className="p-2">{it.nextAttemptAt ? new Date(it.nextAttemptAt).toLocaleTimeString() : '-'}</td>
                      <td className="p-2">{it.lastStatus ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={triggerSync} disabled={flushing}>{flushing ? 'Retrying…' : 'Retry now'}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
