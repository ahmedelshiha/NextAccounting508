import { EventEmitter } from 'events'

type StreamController = { enqueue: (chunk: Uint8Array) => void; close?: () => void }

export interface RealtimeEvent {
  type: string
  data: any
  userId?: string
  timestamp: string
}

interface PubSubAdapter {
  publish: (event: RealtimeEvent) => Promise<void> | void
  onMessage: (handler: (event: RealtimeEvent) => void) => void
}

class InMemoryPubSub implements PubSubAdapter {
  private handlers = new Set<(e: RealtimeEvent) => void>()
  publish(event: RealtimeEvent) {
    for (const h of this.handlers) {
      try { h(event) } catch {}
    }
  }
  onMessage(handler: (event: RealtimeEvent) => void) {
    this.handlers.add(handler)
  }
}

class PostgresPollingPubSub implements PubSubAdapter {
  private sql: any | null = null
  private handler: ((event: RealtimeEvent) => void) | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private lastId = 0
  private readonly pollMs: number
  private readonly table = 'RealtimeEvents'

  constructor() {
    this.pollMs = Math.max(500, parseInt(String(process.env.REALTIME_PG_POLL_MS || '1000'), 10) || 1000)
    try {
      // Lazy import to avoid build-time failures if env is missing
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { neon } = require('@netlify/neon') as { neon: () => any }
      this.sql = neon()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('PostgresPollingPubSub disabled (neon client unavailable):', e)
      this.sql = null
    }
    if (this.sql) {
      // Best-effort table creation
      const create = async () => {
        try {
          await this.sql`CREATE TABLE IF NOT EXISTS "RealtimeEvents" (
            id BIGSERIAL PRIMARY KEY,
            payload JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )`
          await this.sql`CREATE INDEX IF NOT EXISTS "RealtimeEvents_created_at_idx" ON "RealtimeEvents" (created_at)`
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('RealtimeEvents table ensure failed:', e)
        }
      }
      void create()
    }
  }

  publish = async (event: RealtimeEvent) => {
    if (!this.sql) return
    try {
      await this.sql`INSERT INTO "RealtimeEvents" (payload) VALUES (${JSON.stringify(event)}::jsonb)`
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Realtime publish failed:', e)
    }
  }

  onMessage(handler: (event: RealtimeEvent) => void) {
    this.handler = handler
    if (!this.sql || this.pollTimer) return
    this.pollTimer = setInterval(async () => {
      try {
        const rows = (await this.sql`SELECT id, payload FROM "RealtimeEvents" WHERE id > ${this.lastId} ORDER BY id ASC LIMIT 500`) as Array<{ id: number; payload: any }>
        for (const row of rows) {
          this.lastId = Math.max(this.lastId, Number(row.id))
          if (row.payload && this.handler) {
            try { this.handler(row.payload as RealtimeEvent) } catch {}
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Realtime poll failed:', e)
      }
    }, this.pollMs)
  }
}

function createAdapterFromEnv(): PubSubAdapter {
  const transport = String(process.env.REALTIME_TRANSPORT || 'memory').toLowerCase()
  switch (transport) {
    case 'postgres':
    case 'pg':
      return new PostgresPollingPubSub()
    default:
      return new InMemoryPubSub()
  }
}

class EnhancedRealtimeService extends EventEmitter {
  private connections = new Map<string, { controller: StreamController; userId: string; eventTypes: Set<string> }>()
  private adapter: PubSubAdapter

  constructor(adapter?: PubSubAdapter) {
    super()
    this.adapter = adapter ?? createAdapterFromEnv()
    this.adapter.onMessage((evt) => {
      this.dispatch(evt, true)
    })
  }

  subscribe(controller: StreamController, userId: string, eventTypes: string[]): string {
    const connectionId = Math.random().toString(36).slice(2)
    const types = new Set(eventTypes && eventTypes.length ? eventTypes : ['all'])
    this.connections.set(connectionId, { controller, userId, eventTypes: types })
    return connectionId
  }

  private shouldDeliver(conn: { userId: string; eventTypes: Set<string> }, event: RealtimeEvent) {
    const typeAllowed = conn.eventTypes.has('all') || (event.type && conn.eventTypes.has(event.type))
    const userAllowed = !event.userId || event.userId === conn.userId
    return typeAllowed && userAllowed
  }

  private dispatch(event: RealtimeEvent, fromBus = false) {
    this.broadcastLocal(event)
    if (!fromBus) {
      try { void this.adapter.publish(event) } catch {}
    }
  }

  private broadcastLocal(event: RealtimeEvent) {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    const bytes = new TextEncoder().encode(payload)
    for (const [id, conn] of this.connections.entries()) {
      if (!this.shouldDeliver(conn, event)) continue
      try {
        conn.controller.enqueue(bytes)
      } catch {
        this.connections.delete(id)
        try { conn.controller.close?.() } catch {}
      }
    }
  }

  broadcast(event: RealtimeEvent) {
    this.dispatch(event)
  }

  broadcastToUser(userId: string, event: RealtimeEvent) {
    const ev = { ...event, userId }
    this.dispatch(ev)
  }

  emitServiceRequestUpdate(serviceRequestId: string | number, data: any = {}) {
    this.dispatch({ type: 'service-request-updated', data: { serviceRequestId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTaskUpdate(taskId: string | number, data: any = {}) {
    this.dispatch({ type: 'task-updated', data: { taskId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTeamAssignment(data: any) {
    this.dispatch({ type: 'team-assignment', data, timestamp: new Date().toISOString() })
  }

  cleanup(connectionId: string) {
    const conn = this.connections.get(connectionId)
    if (conn) {
      try { conn.controller.close?.() } catch {}
    }
    this.connections.delete(connectionId)
  }
}

export const realtimeService = new EnhancedRealtimeService()
