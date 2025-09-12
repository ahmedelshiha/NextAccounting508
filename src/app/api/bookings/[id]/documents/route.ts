import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: 'Document storage is not configured. Connect storage (e.g., Supabase Storage or Builder CMS assets) and implement persistence.' }, { status: 501 })
}

export async function POST(req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Use multipart/form-data with files[]' }, { status: 400 })
  }
  return NextResponse.json({ error: 'Document storage is not configured. Connect storage (e.g., Supabase Storage or Builder CMS assets) and implement persistence.' }, { status: 501 })
}
