import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">FAQ — Coming Soon</h1>
        <p className="text-lg text-gray-600 mb-8">We are preparing a helpful FAQ to answer common questions about our services and processes. Check back soon.</p>

        <div className="mt-6">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">Return home</Link>
        </div>
      </div>
    </div>
  )
}
