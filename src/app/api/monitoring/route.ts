import { NextRequest, NextResponse } from 'next/server'

// Proxy incoming requests from client SDK to Sentry ingest endpoint.
// This allows using a relative tunnel path (/monitoring) from the browser
// while keeping the real Sentry DSN secret on the server.

function buildSentryEndpointFromDsn(dsn: string | undefined) {
  if (!dsn) return null
  // DSN example: https://<publicKey>@o12345.ingest.sentry.io/67890
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const host = url.host
    const projectId = url.pathname.replace(/^\//, '')
    // Use /api/<projectId>/envelope/?sentry_key=<publicKey>
    const proto = url.protocol
    return `${proto}//${host}/api/${projectId}/envelope/?sentry_key=${publicKey}`
  } catch (err) {
    return null
  }
}

export async function POST(request: NextRequest) {
  const dsn = process.env.SENTRY_DSN
  const endpoint = buildSentryEndpointFromDsn(dsn)
  if (!endpoint) {
    return NextResponse.json({ error: 'Sentry not configured' }, { status: 501 })
  }

  // Forward body and most headers
  const body = await request.arrayBuffer()
  const headers: Record<string, string> = {}
  // Copy content-type and sentry-specific headers if present
  const ct = request.headers.get('content-type')
  if (ct) headers['content-type'] = ct
  const sentryAuth = request.headers.get('x-sentry-auth')
  if (sentryAuth) headers['x-sentry-auth'] = sentryAuth

  try {
    const res = await fetch(endpoint, { method: 'POST', body: Buffer.from(body), headers })
    const text = await res.text()
    return new NextResponse(text, { status: res.status })
  } catch (err) {
    console.error('Error proxying to Sentry:', err)
    return NextResponse.json({ error: 'Failed to proxy to Sentry' }, { status: 502 })
  }
}

export async function GET() {
  // Health check
  return NextResponse.json({ ok: true })
}
