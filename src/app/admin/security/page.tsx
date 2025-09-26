import SecurityCenter from '@/components/security/security-center'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Security Center</h1>
        <p className="text-gray-600 mb-6">Monitor system health and recent security events.</p>
        <SecurityCenter />
      </div>
    </div>
  )
}
