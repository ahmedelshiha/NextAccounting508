import { Suspense } from 'react'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import QuarantineClient from './QuarantineClient'

export default function QuarantinePage() {
  return (
    <StandardPage title="Uploads: Quarantine" subtitle="Review and manage quarantined uploads">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <QuarantineClient />
      </Suspense>
    </StandardPage>
  )
}
