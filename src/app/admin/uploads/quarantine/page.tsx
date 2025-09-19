import { Suspense } from 'react'
import QuarantineClient from './QuarantineClient'

export default function QuarantinePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <QuarantineClient />
    </Suspense>
  )
}
