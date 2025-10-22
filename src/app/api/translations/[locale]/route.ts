import { NextResponse } from 'next/server'
import { getServerTranslations } from '@/lib/server/translations'

export async function GET(request: Request, { params }: { params: { locale: string } }) {
  const { locale } = params
  const translations = await getServerTranslations(locale)

  const res = NextResponse.json(translations)
  // Cache for 24 hours on CDN and browser; treat as immutable (version via filename recommended)
  res.headers.set('Cache-Control', 'public, max-age=86400, immutable')
  return res
}
