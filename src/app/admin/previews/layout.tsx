import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Previews',
  description: 'Lightweight preview shell for admin templates',
}

interface Props {
  children: React.ReactNode
}

// Lightweight layout for preview pages that avoids server-side auth/session resolution
// to prevent serverless function timeouts in production. These previews only render
// static client components and do not require authenticated context.
export default function PreviewLayout({ children }: Props) {
  // Basic container to mimic admin workspace background without heavy providers
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-screen-2xl p-6">
        {children}
      </main>
    </div>
  )
}
