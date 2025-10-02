import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { ClientLayout } from '@/components/providers/client-layout'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchemaMarkup } from '@/components/seo/SchemaMarkup'
import { getEffectiveOrgSettingsFromHeaders } from '@/lib/org-settings'
import { SettingsProvider } from '@/components/providers/SettingsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services. Book your free consultation today.',
  keywords: ['accounting', 'bookkeeping', 'tax preparation', 'payroll', 'CFO advisory', 'small business accounting'],
  authors: [{ name: 'Accounting Firm' }],
  creator: 'Accounting Firm',
  publisher: 'Accounting Firm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
} satisfies import('next').Metadata

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard getServerSession with a short timeout to avoid blocking rendering when auth DB is slow
  let session = null as any
  try {
    session = await Promise.race([
      getServerSession(authOptions),
      new Promise(resolve => setTimeout(() => resolve(null), 500)),
    ])
  } catch {
    session = null
  }

  // Load organization defaults with tenant scoping (server-side, no auth required for read)
  let orgLocale = 'en'
  let orgName = 'Accounting Firm'
  let orgLogoUrl: string | null | undefined = null
  let contactEmail: string | null | undefined = null
  let contactPhone: string | null | undefined = null
  let legalLinks: Record<string, string> | null | undefined = null
  try {
    const eff = await getEffectiveOrgSettingsFromHeaders()
    orgLocale = eff.locale || 'en'
    orgName = eff.name || orgName
    orgLogoUrl = eff.logoUrl ?? null
    contactEmail = eff.contactEmail ?? null
    contactPhone = eff.contactPhone ?? null
    legalLinks = eff.legalLinks ?? null
  } catch {}

  return (
    <html lang={orgLocale}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/next.svg" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Global skip link for keyboard users */}
        <a
          href="#site-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
        >
          Skip to main content
        </a>
        <TranslationProvider initialLocale={orgLocale as any}>
          <SettingsProvider initialSettings={{ name: orgName, logoUrl: orgLogoUrl ?? null, contactEmail: contactEmail ?? null, contactPhone: contactPhone ?? null, legalLinks: legalLinks ?? null, defaultLocale: orgLocale }}>
            <ClientLayout session={session} orgName={orgName} orgLogoUrl={orgLogoUrl || undefined} contactEmail={contactEmail || undefined} contactPhone={contactPhone || undefined} legalLinks={legalLinks || undefined}>
              {children}
            </ClientLayout>
          </SettingsProvider>
        </TranslationProvider>

        {/* Structured data for SEO */}
        <SchemaMarkup />

        {/* Performance monitoring: report page load time to analytics (gtag stub) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function(){
              try {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    try {
                      var navigation = performance.getEntriesByType('navigation')[0];
                      if (navigation && typeof gtag !== 'undefined') {
                        var loadTime = navigation.loadEventEnd - navigation.fetchStart || 0;
                        gtag('event', 'page_load_time', { event_category: 'Performance', value: Math.round(loadTime) });
                      }
                    } catch(e){}
                  }, 0);
                });
              } catch(e){}
            })();
          `,
          }}
        />
      </body>
    </html>
  )
}
