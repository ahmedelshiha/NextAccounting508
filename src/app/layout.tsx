import type { Metadata } from 'next'
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
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
