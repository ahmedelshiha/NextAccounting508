export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
  // Return mock historical metrics for the system health charts
  const now = Date.now()
  const entries = Array.from({ length: 12 }).map((_, i) => {
    const ts = new Date(now - (11 - i) * 60 * 60 * 1000) // hourly points
    return {
      timestamp: ts.toISOString(),
      databaseResponseTime: 40 + Math.round(Math.random() * 80),
      apiErrorRate: +(Math.random() * 2).toFixed(2)
    }
  })

  return new Response(JSON.stringify({ entries }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
