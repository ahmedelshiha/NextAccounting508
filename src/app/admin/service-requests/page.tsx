import { Suspense } from 'react'
import ClientPage from './ClientPage'

// Mark this page as dynamic since it uses useSearchParams
export const dynamic = 'force-dynamic'

function ServiceRequestsPageContent() {
  return <ClientPage />
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center text-gray-400 py-12">Loading…</div></div></div>}>
      <ServiceRequestsPageContent />
    </Suspense>
  )
}
