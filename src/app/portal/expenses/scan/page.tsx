import ReceiptScanner from '@/components/expenses/receipt-scanner'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Receipt Scanner</h1>
        <p className="text-gray-600 mb-6">Upload a receipt image or PDF, verify extracted details, and save it to your expenses.</p>
        <ReceiptScanner />
      </div>
    </div>
  )
}
