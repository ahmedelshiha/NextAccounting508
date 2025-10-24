'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { PermissionGate } from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

interface UserLocaleData {
  userId: string
  email: string
  timezone: string
  preferredLanguage: 'en' | 'ar' | 'hi'
  bookingEmailReminder: boolean
  bookingSmsReminder: boolean
}

interface UserLocaleViewProps {
  userId: string
  email?: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  hi: 'Hindi',
}

/**
 * Admin support view for user locale settings
 * Shows timezone and language preferences for support staff
 * Permission-gated with COMMUNICATION_SETTINGS_VIEW
 */
export function UserLocaleView({ userId, email }: UserLocaleViewProps) {
  const [data, setData] = useState<UserLocaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserLocale = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch user preferences - this would be called from support context where we have the user ID
        const response = await fetch(`/api/admin/users/${userId}/preferences`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found')
          } else if (response.status === 403) {
            setError('Permission denied')
          } else {
            setError('Failed to load user locale data')
          }
          return
        }

        const preferences = await response.json()
        setData({
          userId,
          email: email || 'Unknown',
          timezone: preferences.timezone || 'UTC',
          preferredLanguage: preferences.preferredLanguage || 'en',
          bookingEmailReminder: preferences.bookingEmailReminder ?? true,
          bookingSmsReminder: preferences.bookingSmsReminder ?? false,
        })
      } catch (err) {
        console.error('Failed to fetch user locale:', err)
        setError('Failed to load user locale data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserLocale()
  }, [userId, email])

  return (
    <PermissionGate permission={PERMISSIONS.COMMUNICATION_SETTINGS_VIEW}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Communication Preferences</CardTitle>
          <CardDescription>User&apos;s timezone and language settings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 p-3 bg-red-50 rounded">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Timezone</p>
                  <p className="text-sm font-medium text-gray-900">{data.timezone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Language</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {LANGUAGE_LABELS[data.preferredLanguage] || data.preferredLanguage}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Notification Preferences</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Email Reminders</span>
                    <Badge variant={data.bookingEmailReminder ? 'default' : 'outline'}>
                      {data.bookingEmailReminder ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">SMS Reminders</span>
                    <Badge variant={data.bookingSmsReminder ? 'default' : 'outline'}>
                      {data.bookingSmsReminder ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PermissionGate>
  )
}

export default UserLocaleView
