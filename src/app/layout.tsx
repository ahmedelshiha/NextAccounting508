import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { ClientLayout } from '@/components/providers/client-layout'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchemaMarkup } from '@/components/seo/SchemaMarkup'

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
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/next.svg" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className}>
        {/* Global skip link for keyboard users */}
        <a
          href="#site-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 rounded"
        >
          Skip to main content
        </a>
        <TranslationProvider>
          <ClientLayout session={session}>
            {children}
          </ClientLayout>
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
