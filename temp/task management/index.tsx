import React from 'react'
import DevTaskManagement from './dev-task-management'
import React from 'react'

// Dev fetch wrapper: catch network errors and return a controlled Response to prevent
// cascading unhandled rejections across the app during development/HMR.
if (typeof window !== 'undefined' && !(window as any).__devFetchWrapped) {
  try {
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      try {
        return await originalFetch(input, init)
      } catch (err) {
        // Log and return a safe 503-like Response so callers can handle non-ok responses.
        // This reduces "Failed to fetch" uncaught errors in the console during hot reloads.
        // eslint-disable-next-line no-console
        console.warn('[dev-fetch-wrapper] fetch failed, returning 503 placeholder', err, String(input))
        const body = JSON.stringify({ error: 'Network error (dev fetch wrapper)' })
        return new Response(body, { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } })
      }
    }
    ;(window as any).__devFetchWrapped = true
  } catch (e) {
    // ignore any issues installing the wrapper
    // eslint-disable-next-line no-console
    console.warn('[dev-fetch-wrapper] failed to install wrapper', e)
  }
}

export default function DevTasksApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Task Management — Development Mode</div>
          <a href="/admin" className="text-xs text-blue-600 hover:underline">Back to Admin</a>
        </div>
      </div>
      <DevTaskManagement />
    </div>
  )
}
