import { Suspense } from 'react'
import ServiceRequestsClient from './ServiceRequestsClient'

// Server component wrapper that provides a Suspense boundary required for
// client hooks like useSearchParams used inside ServiceRequestsClient.

export default function PortalServiceRequestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ServiceRequestsClient />
    </Suspense>
  )
}
