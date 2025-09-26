import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { TaxCalculator } from '@/components/tools/tax-calculator'
import { ROICalculator } from '@/components/tools/roi-calculator'

export default function FinancialToolsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Tools</h1>
          <p className="text-lg text-gray-600">Use these calculators to estimate taxes and ROI. For tailored advice, book a consultation.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaxCalculator />
          <ROICalculator />
        </div>
        <div className="text-center mt-8">
          <Button asChild>
            <Link href="/booking">Book a Free Consultation</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
