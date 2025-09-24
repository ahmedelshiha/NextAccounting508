import { ClientLayout } from '@/components/providers/client-layout'
import { ClientLayout } from '@/components/providers/client-layout'
import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
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
} satisfies import('next').Metadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className}>
        <TranslationProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </TranslationProvider>
      </body>
    </html>
  )
}
