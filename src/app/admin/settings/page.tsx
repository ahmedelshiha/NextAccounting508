import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
  const _hasNextAuth = Boolean(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Settings className="h-6 w-6 mr-2"/> Settings</h1>
          <p className="text-gray-600 mt-2">Environment and system configuration overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
              <CardDescription>Connection status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">NETLIFY_DATABASE_URL</div>
                <Badge className={hasDb ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {hasDb ? 'Configured' : 'Missing'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>NextAuth configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">NEXTAUTH_URL</div>
                  <Badge className={process.env.NEXTAUTH_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {process.env.NEXTAUTH_URL ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">NEXTAUTH_SECRET</div>
                  <Badge className={process.env.NEXTAUTH_SECRET ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {process.env.NEXTAUTH_SECRET ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
