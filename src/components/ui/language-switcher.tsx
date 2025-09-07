'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function LanguageSwitcher() {
  const pathname = usePathname() || '/'
  const segments = pathname.split('/').filter(Boolean)
  const currentLocale = segments[0] && ['en', 'ar', 'hi'].includes(segments[0]) ? segments[0] : null

  // Remove existing locale prefix
  const pathWithoutLocale = currentLocale ? '/' + segments.slice(1).join('/') : pathname
  const normalizedPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale

  const buildHref = (locale: string) => {
    return `/${locale}${normalizedPath}` || `/${locale}`
  }

  return (
    <div className="flex items-center space-x-2">
      <Link href={buildHref('en')} className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-100">
        EN
      </Link>
      <Link href={buildHref('ar')} className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-100">
        AR
      </Link>
      <Link href={buildHref('hi')} className="px-2 py-1 text-sm font-medium rounded hover:bg-gray-100">
        HI
      </Link>
    </div>
  )
}
