'use client'

import SettingsShell from '@/components/admin/settings/SettingsShell'
import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'
import CurrencyManager from '@/components/admin/currency-manager'

export default function Page() {
  return (
    <SettingsShell
      title="Currencies"
      description="Manage currencies, defaults, symbols/decimals, activity, and rate refresh"
      sidebar={<SettingsNavigation />}
    >
      <p className="text-sm text-gray-600 mb-4">Manage site currencies, set default, edit symbols/decimals, toggle active, refresh rates, and export CSV from this single page.</p>
      <div className="mt-4">
        <CurrencyManager />
      </div>
    </SettingsShell>
  )
}
