import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { realtimeService } from '@/lib/realtime-enhanced'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventTypes = (searchParams.get('events')?.split(',') ?? ['all']).filter(Boolean)
  const userId = String((session.user as any).id ?? 'anon')

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`))
      const connectionId = realtimeService.subscribe(controller as any, userId, eventTypes)
      const onAbort = () => {
        realtimeService.cleanup(connectionId)
        try { controller.close() } catch {}
      }
      // @ts-ignore — standard in Next runtime
      request.signal.addEventListener('abort', onAbort)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
