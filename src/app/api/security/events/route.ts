export const runtime = 'edge'

export async function GET() {
  const now = Date.now()
  return NextResponse.json({
    success: true,
    data: [
      { id: 'e1', type: 'failed_login', message: '5 failed logins detected for user john@example.com', timestamp: new Date(now - 1000 * 60 * 15).toISOString() },
      { id: 'e2', type: 'rate_limit', message: 'API rate limit triggered on /api/analytics/track', timestamp: new Date(now - 1000 * 60 * 45).toISOString() },
      { id: 'e3', type: 'scan_detected', message: 'Upload flagged by AV (lenient mode) and quarantined', timestamp: new Date(now - 1000 * 60 * 90).toISOString() },
    ]
  })
}
