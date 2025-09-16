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

function createAdapterFromEnv(): PubSubAdapter {
  const transport = String(process.env.REALTIME_TRANSPORT || 'memory').toLowerCase()
  switch (transport) {
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
