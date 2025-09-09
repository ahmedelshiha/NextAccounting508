import prisma from '@/lib/prisma'
import dynamic from 'next/dynamic'

const CurrencyQuickModal = dynamic(() => import('@/components/admin/currency-quick-modal'), { ssr: false })

export default async function Page() {
  const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
  const currencies = await prisma.currency.findMany({ orderBy: { isDefault: 'desc' } })
  const withRate = await Promise.all(currencies.map(async (c) => {
    const rate = await prisma.exchangeRate.findFirst({ where: { base, target: c.code }, orderBy: { fetchedAt: 'desc' } })
    return { code: c.code, name: c.name, symbol: c.symbol, decimals: c.decimals, active: c.active, isDefault: c.isDefault, lastRate: rate?.rate ?? null }
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Currencies</h1>
        {/* Client-side comprehensive manager loaded here */}
        <CurrencyQuickModal />
      </div>

      <p className="text-sm text-gray-600 mb-4">Manage site currencies, set default, edit symbols/decimals, toggle active, and manage per-entity price overrides.</p>

      <div>
        {/* Server-rendered table as reference */}
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="py-2">Code</th>
              <th className="py-2">Name</th>
              <th className="py-2">Symbol</th>
              <th className="py-2">Decimals</th>
              <th className="py-2">Last Rate</th>
              <th className="py-2">Active</th>
              <th className="py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            {withRate.map((c) => (
              <tr key={c.code} className="border-t">
                <td className="py-2 font-medium">{c.code}</td>
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.symbol ?? '-'}</td>
                <td className="py-2">{c.decimals}</td>
                <td className="py-2">{c.lastRate ?? '-'}</td>
                <td className="py-2">{c.active ? 'Yes' : 'No'}</td>
                <td className="py-2">{c.isDefault ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
