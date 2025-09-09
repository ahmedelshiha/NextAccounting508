import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers — Coming Soon</h1>
        <p className="text-lg text-gray-600 mb-8">We're building our team. Check back soon for open positions and opportunities to join Accounting Firm.</p>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">Want to be notified when we launch careers? Join our mailing list.</p>
          <form className="flex items-center max-w-md mx-auto gap-2">
            <input type="email" placeholder="Your email" className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none" />
            <Button asChild>
              <Link href="/">Notify Me</Link>
            </Button>
          </form>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">Return home</Link>
        </div>
      </div>
    </div>
  )
}
