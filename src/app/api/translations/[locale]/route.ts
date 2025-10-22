import { NextResponse, NextRequest } from 'next/server'
import { getServerTranslations } from '@/lib/server/translations'

export async function GET(request: NextRequest, context: any) {
  // Next.js sometimes provides params as a Promise in the context; handle both
  let params = context?.params
  if (params && typeof params.then === 'function') {
    try {
      params = await params
    } catch {
      params = undefined
    }
  }

  const locale = (params && params.locale) || 'en'
  const translations = await getServerTranslations(locale)

  const res = NextResponse.json(translations)
  // Cache for 24 hours on CDN and browser; treat as immutable (version via filename recommended)
  res.headers.set('Cache-Control', 'public, max-age=86400, immutable')
  return res
}
