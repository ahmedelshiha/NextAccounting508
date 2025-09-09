import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FinancialToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Financial Tools — Coming Soon</h1>
        <p className="text-lg text-gray-600 mb-8">We are building calculators and tools to help you manage cash flow, payroll estimates, and tax projections. Stay tuned.</p>

        <div className="mt-6">
          <Button asChild>
            <Link href="/blog">Read Related Articles</Link>
          </Button>
        </div>

        <div className="mt-8">
          <Link href="/contact" className="text-sm text-blue-600 hover:underline">Contact Us for Tools</Link>
        </div>
      </div>
    </div>
  )
}
