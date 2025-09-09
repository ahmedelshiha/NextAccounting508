'use client'

import CurrencyManager from '@/components/admin/currency-manager'

export default function Page() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Currencies</h1>
      </div>

      <p className="text-sm text-gray-600 mb-4">Manage site currencies, set default, edit symbols/decimals, toggle active, refresh rates, and export CSV from this single page.</p>

      <div className="mt-4">
        <CurrencyManager />
      </div>
    </div>
  )
}
