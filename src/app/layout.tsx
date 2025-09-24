import './globals.css'
import { TranslationProvider } from '@/components/providers/translation-provider'
import { ClientLayout } from '@/components/providers/client-layout'
import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className={inter.className}>
        <TranslationProvider>
          <ClientLayout session={session}>
            {children}
          </ClientLayout>
        </TranslationProvider>
      </body>
    </html>
  )
}
