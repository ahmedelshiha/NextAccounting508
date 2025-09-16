import { EventEmitter } from 'events'

type StreamController = { enqueue: (chunk: Uint8Array) => void; close?: () => void }

interface RealtimeEvent {
  type: string
  data: any
  userId?: string
  timestamp: string
}

class EnhancedRealtimeService extends EventEmitter {
  private connections = new Map<string, { controller: StreamController; userId: string; eventTypes: Set<string> }>()

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

  broadcast(event: RealtimeEvent) {
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

  broadcastToUser(userId: string, event: RealtimeEvent) {
    const ev = { ...event, userId }
    this.broadcast(ev)
  }

  emitServiceRequestUpdate(serviceRequestId: string | number, data: any = {}) {
    this.broadcast({ type: 'service-request-updated', data: { serviceRequestId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTaskUpdate(taskId: string | number, data: any = {}) {
    this.broadcast({ type: 'task-updated', data: { taskId, ...data }, timestamp: new Date().toISOString() })
  }

  emitTeamAssignment(data: any) {
    this.broadcast({ type: 'team-assignment', data, timestamp: new Date().toISOString() })
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
