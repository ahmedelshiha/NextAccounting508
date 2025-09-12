import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { Session } from 'next-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple server-sent events endpoint that pushes task summaries every 5s
export async function GET(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null
  if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user?.role ?? '')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      // clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        closed = true
      })

      async function sendSnapshot() {
        if (closed) return
        try {
          const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
          let tasks: Array<{ id: string; title: string; dueAt: Date | null; priority: string; status: string }>
          let notifications: Array<{ id: string; type: string; message: string; taskId?: string }> = []
          if (!hasDb) {
            tasks = [
              { id: 't1', title: 'Send monthly newsletters', dueAt: null, priority: 'HIGH', status: 'OPEN' },
              { id: 't2', title: 'Review pending bookings', dueAt: null, priority: 'MEDIUM', status: 'OPEN' },
            ]
            // sample notification: overdue/high priority
            notifications = tasks
              .filter((t) => t.priority === 'HIGH' && t.dueAt && new Date(t.dueAt) < new Date())
              .map((t) => ({ id: `notif-${t.id}`, type: 'overdue', message: `${t.title} is overdue`, taskId: t.id }))
          } else {
            tasks = await prisma.task.findMany({ orderBy: { updatedAt: 'desc' }, take: 50, select: { id: true, title: true, updatedAt: true, dueAt: true, priority: true, status: true } })
            // compute notifications: overdue HIGH priority tasks
            const now = new Date()
            const overdueHigh = await prisma.task.findMany({ where: { dueAt: { lt: now }, status: { not: 'DONE' }, priority: 'HIGH' }, select: { id: true, title: true, dueAt: true } })
            notifications = overdueHigh.map((t) => ({ id: `notif-${t.id}`, type: 'overdue', message: `${t.title} is overdue`, taskId: t.id }))
          }

          const payload = JSON.stringify({ ts: Date.now(), tasks, notifications })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch (_err) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'error' })}\n\n`))
        }
      }

      // initial send
      await sendSnapshot()

      // periodic
      const iv = setInterval(() => sendSnapshot(), 5000)

      // keep stream alive padding
      const pingIv = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 20000)

      // cleanup
      const cleanup = () => {
        clearInterval(iv)
        clearInterval(pingIv)
        controller.close()
      }

      request.signal.addEventListener('abort', cleanup)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
