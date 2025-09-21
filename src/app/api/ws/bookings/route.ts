export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { realtimeService } from '@/lib/realtime-enhanced'

// WebSocket endpoint for booking realtime events
// Attempts to upgrade to a WebSocket and bridge events from realtimeService.
// If clients cannot use WebSocket they should fallback to SSE (/api/portal/realtime)

export async function GET(request: Request) {
  try {
    // WebSocketPair is provided by the Next runtime in edge handlers
    // @ts-expect-error: WebSocketPair provided by runtime at execution time
    const pair = new WebSocketPair()
    const [client, server] = pair

    // Try to authenticate user from NextAuth JWT (cookie or Authorization header)
    let userId: string | null = null
    try {
      const mod = await import('next-auth/jwt')
      const secret = (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET) as string | undefined
      const token = await (mod as any).getToken({ req: request as any, secret })
      if (token?.sub) userId = String(token.sub)
    } catch {}

    // Prepare a controller-like object that realtimeService understands
    const controller = {
      enqueue: (bytes: Uint8Array) => {
        try {
          // bytes are UTF-8 payloads encoded by realtimeService; decode to string
          const text = new TextDecoder().decode(bytes)
          try { client.send(text) } catch {}
        } catch {}
      },
      close: () => {
        try { client.close() } catch {}
      }
    }

    // Accept the server side socket to receive messages from client
    server.accept()

    // Default connection id storage
    let connectionId: string | null = null

    // On open, register subscription using query param events if provided
    try {
      const url = new URL((request as any).url || 'http://localhost')
      const eventsParam = url.searchParams.get('events')
      const events = eventsParam ? eventsParam.split(',').map(s => s.trim()).filter(Boolean) : ['all']
      connectionId = realtimeService.subscribe(controller as any, userId || 'anon', events)
    } catch (e) {
      // ignore
    }

    server.addEventListener('message', (evt: any) => {
      try {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data
        // Support 'subscribe' messages: { type: 'subscribe', events: ['availability-updated'] }
        if (data && data.type === 'subscribe') {
          try {
            const events = Array.isArray(data.events) && data.events.length ? data.events : ['all']
            // Replace subscription by creating a new one
            if (connectionId) realtimeService.cleanup(connectionId)
            connectionId = realtimeService.subscribe(controller as any, String(userId || data.userId || 'anon'), events)
          } catch {}
        }
      } catch {}
    })

    server.addEventListener('close', () => {
      try { if (connectionId) realtimeService.cleanup(connectionId) } catch {}
    })

    // Return the client side of the pair to complete the WS upgrade
    // WebSocket return typing provided by runtime; using client object for upgrade
    return new Response(null as any, { status: 101, webSocket: client } as any)
  } catch (e) {
    console.error('ws/bookings upgrade failed', e)
    return NextResponse.json({ error: 'WebSocket not supported in this runtime' }, { status: 501 })
  }
}
