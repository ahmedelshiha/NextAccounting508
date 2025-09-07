"use client"

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'
import { usePathname } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname() || '/'

  // Determine locale from first path segment: /en, /ar, /hi
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const locale = firstSegment === 'ar' ? 'AR' : firstSegment === 'hi' ? 'HI' : 'EN'

  return (
    <SessionProvider>
      <div dir={locale === 'AR' ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col">
        <Navigation locale={locale} />
        <main className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </div>
      <Toaster />
    </SessionProvider>
  )
}
