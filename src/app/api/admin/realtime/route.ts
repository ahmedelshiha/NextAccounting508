import { NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { realtimeService } from '@/lib/realtime-enhanced'

export const runtime = 'nodejs'

export const GET = withTenantContext(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const eventTypes = (searchParams.get('events')?.split(',') ?? ['all']).filter(Boolean)
    const { userId } = tenantContext.getContext()

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder()
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
          )
        )
        const connectionId = realtimeService.subscribe(controller as any, userId, eventTypes)
        const pingId = setInterval(() => {
          try { controller.enqueue(enc.encode(`: ping ${Date.now()}\n\n`)) } catch {}
        }, 25000)
        const onAbort = () => {
          try { clearInterval(pingId) } catch {}
          realtimeService.cleanup(connectionId)
          try { controller.close() } catch {}
        }
        request.signal.addEventListener('abort', onAbort)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  },
  { requireAuth: true }
)
