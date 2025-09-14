import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/realtime'

export async function GET() {
  let unsub: any = null
  let h: any = null
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => {
        try { controller.enqueue(`data: ${JSON.stringify(obj)}\n\n`) } catch (e) { /* ignore */ }
      }

      // Subscribe to in-process broadcaster
      unsub = subscribe((ev) => send(ev))

      // Heartbeat
      h = setInterval(() => send({ type: 'ping', t: Date.now() }), 15000)
    },
    cancel() {
      try { if (typeof unsub === 'function') unsub(); } catch(e){}
      try { clearInterval(h); } catch(e){}
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
