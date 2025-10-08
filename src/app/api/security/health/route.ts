import { collectSystemHealth, toSecurityHealthPayload } from '@/lib/health'

export const runtime = 'edge'

export async function GET() {
  const health = await collectSystemHealth({ includeRealtime: false })
  const payload = toSecurityHealthPayload(health)
  return NextResponse.json(payload)
}
