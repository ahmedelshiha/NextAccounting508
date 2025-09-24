'use client'

import StandardPage from '@/components/dashboard/templates/StandardPage'
import CurrencyManager from '@/components/admin/currency-manager'

export default function Page() {
  return (
    <StandardPage
      title="Currencies"
      subtitle="Manage currencies, defaults, symbols/decimals, activity, and rate refresh"
    >
      <p className="text-sm text-gray-600 mb-4">Manage site currencies, set default, edit symbols/decimals, toggle active, refresh rates, and export CSV from this single page.</p>
      <div className="mt-4">
        <CurrencyManager />
      </div>
    </StandardPage>
  )
}
