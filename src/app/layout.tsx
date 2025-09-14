import { Inter } from 'next/font/google'
import { ClientLayout } from '@/components/providers/client-layout'
import './globals.css'

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
  const themeInitScript = `(function(){try{const theme=typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('theme');if(theme==='dark' || (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){} })();`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
