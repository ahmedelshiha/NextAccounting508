import { EventEmitter } from 'events'

type StreamController = { enqueue: (chunk: Uint8Array) => void; close?: () => void }

interface RealtimeEvent {
  type: string
  data: any
  userId?: string
  timestamp: string
}

class EnhancedRealtimeService extends EventEmitter {
  private connections = new Map<string, Set<StreamController>>()
  private userSubscriptions = new Map<string, Set<string>>() // userId -> event types

  subscribe(controller: StreamController, userId: string, eventTypes: string[]): string {
    const connectionId = Math.random().toString(36).slice(2)

    if (!this.connections.has(connectionId)) this.connections.set(connectionId, new Set())
    this.connections.get(connectionId)!.add(controller)

    if (!this.userSubscriptions.has(userId)) this.userSubscriptions.set(userId, new Set())
    eventTypes.forEach((t) => this.userSubscriptions.get(userId)!.add(t))

    return connectionId
  }

  broadcast(event: RealtimeEvent) {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    const bytes = new TextEncoder().encode(payload)
    this.connections.forEach((controllers) => {
      controllers.forEach((c) => {
        try {
          c.enqueue(bytes)
        } catch {
          // drop broken controller
        }
      })
    })
  }

  broadcastToUser(userId: string, event: RealtimeEvent) {
    // Basic per-user broadcast by filtering subscriptions; for now, reuse global broadcast
    this.broadcast({ ...event, userId })
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
    this.connections.delete(connectionId)
  }
}

export const realtimeService = new EnhancedRealtimeService()
