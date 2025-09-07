import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClientLayout } from '@/components/providers/client-layout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Accounting Firm - Professional Accounting Services',
  description: 'Professional accounting services for growing businesses. Expert bookkeeping, tax preparation, payroll management, and CFO advisory services.',
  keywords: ['accounting', 'bookkeeping', 'tax preparation', 'payroll', 'CFO advisory', 'small business accounting'],
  authors: [{ name: 'Accounting Firm' }],
  creator: 'Accounting Firm',
  publisher: 'Accounting Firm',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.example.com'

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteUrl + "#organization",
        "name": "Accounting Firm",
        "url": siteUrl,
        "logo": siteUrl + "/logo.png",
        "sameAs": [
          "https://facebook.com/accountingfirm",
          "https://twitter.com/accountingfirm",
          "https://linkedin.com/company/accountingfirm"
        ]
      },
      {
        "@type": "WebSite",
        "@id": siteUrl + "#website",
        "url": siteUrl,
        "name": "Accounting Firm",
        "publisher": { "@id": siteUrl + "#organization" }
      },
      {
        "@type": "BreadcrumbList",
        "@id": siteUrl + "#breadcrumbs",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl }
        ]
      }
    ]
  })

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <meta name="robots" content="index,follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
