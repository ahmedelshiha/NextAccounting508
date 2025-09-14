import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/realtime'

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(obj)}\n\n`)
        } catch (e) { /* ignore */ }
      }

      // Subscribe to in-process broadcaster
      const unsub = subscribe((ev) => send(ev))

      // Heartbeat
      const h = setInterval(() => send({ type: 'ping', t: Date.now() }), 15000)

      // When stream is canceled, cleanup
      controller.signal.addEventListener('abort', () => {
        clearInterval(h)
        unsub()
      })
    }
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }
  })
}
