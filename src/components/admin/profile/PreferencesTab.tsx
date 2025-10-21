'use client'

import { Loader2 } from 'lucide-react'

export default function PreferencesTab({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center justify-center py-12 text-gray-500">
        <p className="text-sm">Preferences settings coming soon</p>
      </div>
    </div>
  )
}
