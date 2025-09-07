"use client"

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { Navigation } from '@/components/ui/navigation'
import { Footer } from '@/components/ui/footer'

interface ClientLayoutProps {
  children: React.ReactNode
}

import { useEffect } from 'react'

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    // Add aria-labels to icon-only links/buttons where possible using heuristics
    const elements = Array.from(document.querySelectorAll('a,button')) as HTMLElement[]
    elements.forEach((el) => {
      try {
        const hasAccessibleName = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.textContent || '').trim().length > 0
        if (hasAccessibleName) return

        const svg = el.querySelector('svg') as SVGElement | null
        if (!svg) return

        // Try SVG <title>
        const svgTitle = svg.querySelector('title')?.textContent?.trim()
        const svgAria = svg.getAttribute('aria-label')
        const candidate = svgTitle || svgAria
        if (candidate) {
          el.setAttribute('aria-label', candidate)
          el.dataset['a11yAdded'] = 'true'
          return
        }

        // Fallback: derive from href if anchor
        if (el.tagName.toLowerCase() === 'a') {
          const href = (el as HTMLAnchorElement).getAttribute('href') || ''
          if (href && href !== '#') {
            const parts = href.split('/').filter(Boolean)
            const last = parts[parts.length - 1] || parts[0]
            const label = last ? `Go to ${decodeURIComponent(last.replace(/[-_]/g, ' '))}` : 'Navigate'
            el.setAttribute('aria-label', label)
            el.dataset['a11yAdded'] = 'true'
            return
          }
        }

        // Final fallback
        el.setAttribute('aria-label', 'Icon button')
        el.dataset['a11yAdded'] = 'true'
      } catch (e) {
        // ignore
      }
    })

    // Log summary for developer visibility
    const added = document.querySelectorAll('[data-a11y-added="true"]').length
    if (added > 0) console.info(`[a11y] Added aria-labels to ${added} icon-only elements`)
  }, [])

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
    </SessionProvider>
  )
}
