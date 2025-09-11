import type { NextRequest } from 'next/server'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: any) => {
        const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      send('ready', { ok: true, ts: Date.now() })

      const heartbeat = setInterval(() => {
        send('heartbeat', { ts: Date.now() })
      }, 15000)

      const emit = setInterval(() => {
        const kinds = ['booking_update', 'task_completed', 'system_alert'] as const
        const kind = kinds[Math.floor(Math.random() * kinds.length)]

        if (kind === 'booking_update') {
          send('booking_update', {
            id: `b-${Math.random().toString(36).slice(2, 8)}`,
            clientName: 'Live Client',
            service: 'Tax Consultation',
            scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            duration: 60,
            revenue: 250 + Math.floor(Math.random() * 200),
            priority: ['low','normal','high'][Math.floor(Math.random()*3)],
            status: 'confirmed',
            location: 'office'
          })
        } else if (kind === 'task_completed') {
          send('task_completed', {
            id: '1',
            title: 'Live Task Update',
          })
        } else if (kind === 'system_alert') {
          send('system_alert', {
            id: `n-${Math.random().toString(36).slice(2, 8)}`,
            title: 'Live System Notice',
            message: 'Background job completed successfully',
            severity: ['info','warning','error','success'][Math.floor(Math.random()*4)],
          })
        }
      }, 20000)

      const close = () => {
        clearInterval(heartbeat)
        clearInterval(emit)
        try { controller.close() } catch {}
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', close)
    },
    cancel() {
      // handled by abort above
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      // CORS for local dev if needed
      'Access-Control-Allow-Origin': '*',
    },
  })
}
