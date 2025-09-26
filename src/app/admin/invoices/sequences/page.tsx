import AutomatedBillingSequences from '@/components/invoicing/automated-billing'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Automated Billing</h1>
        <p className="text-gray-600 mb-6">Build and manage recurring invoice sequences.</p>
        <AutomatedBillingSequences />
      </div>
    </div>
  )
}
