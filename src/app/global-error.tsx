'use client'

'use client'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  try { Sentry.captureException(error) } catch {}
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg border border-gray-200 p-6 text-center bg-white" role="alert" aria-live="assertive">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">An unexpected error occurred. Please try again.</p>
            {error?.digest && (
              <details className="text-xs text-gray-400 mb-4">
                <summary>Error details</summary>
                <code className="break-all">{error.digest}</code>
              </details>
            )}
            <div className="flex items-center justify-center gap-2">
              <button onClick={reset} className="px-4 py-2 rounded-md bg-gray-900 text-white">Try again</button>
              <Link href="/" className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white">Home</Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
