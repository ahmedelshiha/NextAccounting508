import { Suspense } from 'react'
import AdminServiceRequestsClient from './ClientPage'

export default function AdminServiceRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="bg-gray-200 animate-pulse rounded-lg h-24" />
            <div className="bg-gray-200 animate-pulse rounded-lg h-96" />
          </div>
        </div>
      }
    >
      <AdminServiceRequestsClient />
    </Suspense>
  )
}
