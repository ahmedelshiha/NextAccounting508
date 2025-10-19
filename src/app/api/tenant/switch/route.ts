import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Tenant switch endpoint removed — tenant resolution is managed completely via tenant context and session.
export async function POST() {
  return NextResponse.json({ error: 'Tenant switch endpoint removed. Use tenant context (server-side) instead.' }, { status: 410 })
}
