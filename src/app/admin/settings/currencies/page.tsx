import prisma from '@/lib/prisma'
import CurrencyManager from '@/components/admin/currency-manager'

export default async function Page() {
  const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
  const currencies = await prisma.currency.findMany({ orderBy: { isDefault: 'desc' } })
  const withRate = await Promise.all(currencies.map(async (c) => {
    const rate = await prisma.exchangeRate.findFirst({ where: { base, target: c.code }, orderBy: { fetchedAt: 'desc' } })
    return { code: c.code, name: c.name, symbol: c.symbol, decimals: c.decimals, active: c.active, isDefault: c.isDefault, lastRate: rate?.rate ?? null }
  }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Currencies</h1>
      {/* @ts-expect-error Server component passing serializable props */}
      <CurrencyManager initial={withRate} />
    </div>
  )
}
