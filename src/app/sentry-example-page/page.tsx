'use client'

import { Button } from '@/components/ui/button'

export default function SentryExamplePage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">Sentry Example</h1>
      <p className="text-gray-600 mb-6">Click the button below to trigger an error and verify it appears in your Sentry project.</p>
      <Button
        onClick={() => {
          // Intentionally trigger a runtime error
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          myUndefinedFunction()
        }}
      >
        Trigger Sentry Error
      </Button>
    </div>
  )
}
