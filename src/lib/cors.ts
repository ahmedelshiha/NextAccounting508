import { NextRequest, NextResponse } from 'next/server'

// Centralized CORS helpers to allow Builder.io previews and Netlify previews in dev
export const ALLOWED_ORIGIN_PATTERNS = [
  /(^https?:\/\/)?([a-z0-9-]+\.)*projects\.builder\.codes(?::\d+)?$/i,
  /(^https?:\/\/)?([a-z0-9-]+\.)*builder\.codes(?::\d+)?$/i,
  /(^https?:\/\/)?([a-z0-9-]+\.)*builder\.io(?::\d+)?$/i,
  /(^https?:\/\/)?([a-z0-9-]+\.)*netlify\.app(?::\d+)?$/i,
  /(^https?:\/\/)?localhost(?::\d+)?$/i,
]

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false
  try {
    const o = origin.replace(/\/$/, '')
    return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(o))
  } catch {
    return false
  }
}

export function buildCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allowed = isAllowedOrigin(origin)
  const hdrs = new Headers()

  if (allowed) {
    hdrs.set('Access-Control-Allow-Origin', origin)
    hdrs.set('Vary', 'Origin')
  }
  hdrs.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  hdrs.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token')
  hdrs.set('Access-Control-Allow-Credentials', 'true')
  hdrs.set('Access-Control-Max-Age', '86400')

  return hdrs
}

export function corsPreflight(req: NextRequest) {
  const headers = buildCorsHeaders(req)
  return new NextResponse(null, { status: 204, headers })
}
