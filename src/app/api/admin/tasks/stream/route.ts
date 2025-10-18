import { NextResponse } from 'next/server'
import { subscribe } from '@/lib/realtime'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { respond } from '@/lib/api-response'

export const GET = withTenantContext(async () => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.TASKS_READ_ALL)) {
    return respond.forbidden('Forbidden')
  }

  let unsub: any = null
  let h: any = null
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => {
        try { controller.enqueue(`data: ${JSON.stringify(obj)}\n\n`) } catch (e) { /* ignore */ }
      }

      unsub = subscribe((ev) => send(ev))

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
})
