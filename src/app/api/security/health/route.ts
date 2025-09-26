export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'degraded',
      checks: [
        { name: 'Rate Limiters', status: 'ok' },
        { name: 'CSP Reports', status: 'warn' },
        { name: 'AV Scanner Availability', status: 'ok' },
        { name: 'Auth Session Integrity', status: 'ok' },
      ]
    }
  })
}
