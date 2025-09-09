import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/use-permissions'

type Currency = { code: string; name: string; symbol?: string | null; decimals: number; active: boolean; isDefault: boolean; lastRate?: number | null }

export default function CurrencyManager() {
  const perms = usePermissions()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/currencies')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setCurrencies(json)
      const def = json.find((c: Currency) => c.isDefault)
      setSelectedDefault(def?.code ?? null)
    } catch (e) {
      console.error('load currencies error', e)
      setMessage('Failed to load currencies')
    }
  }

  useEffect(() => { load() }, [])

  async function refreshRates() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/currencies/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      const json = await res.json()
      if (res.ok && json.updated) {
        toast.success('Rates refreshed')
        await load()
      } else {
        toast.error('Failed to refresh rates')
      }
    } catch (e) {
      console.error('refreshRates error', e)
      toast.error('Failed to refresh rates')
    }
    setLoading(false)
  }

  async function saveCurrency(code: string) {
    const cur = currencies.find(c => c.code === code)
    if (!cur) return
    setLoading(true)
    try {
      const payload = { symbol: cur.symbol ?? null, decimals: cur.decimals, active: cur.active }
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Saved ${code}`)
      await load()
    } catch (e) {
      console.error('saveCurrency error', e)
      toast.error(`Failed to save ${code}`)
    }
    setLoading(false)
  }

  async function setDefault(code: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Default currency updated')
      await load()
    } catch (e) {
      console.error('setDefault error', e)
      toast.error('Failed to set default')
    }
    setLoading(false)
  }

  async function saveToggleActive(code: string, active: boolean) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Updated')
      await load()
    } catch (e) {
      console.error('saveToggleActive error', e)
      toast.error('Failed to update')
    }
    setLoading(false)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Manage Currencies</h2>
          <p className="text-sm text-gray-600">Edit currencies, set the default, refresh exchange rates, and export a CSV.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={refreshRates} disabled={loading}>Refresh rates</button>
          <button className="btn" onClick={() => { window.location.href = '/api/admin/currencies/export' }}>Export CSV</button>
        </div>
      </div>

      {message && <div className="mb-4 text-sm text-red-600">{message}</div>}

      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Symbol</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Decimals</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Rate</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Active</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Default</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currencies.map((c) => (
              <tr key={c.code} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.code}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.name}</td>
                <td className="px-4 py-3 text-sm">
                  <input
                    className="w-24 border rounded px-2 py-1 text-sm"
                    value={c.symbol ?? ''}
                    onChange={(e) => setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, symbol: e.target.value } : x))}
                  />
                </td>
                <td className="px-4 py-3 text-sm w-24">
                  <input
                    type="number"
                    className="w-20 border rounded px-2 py-1 text-sm"
                    value={c.decimals}
                    onChange={(e) => setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, decimals: Number(e.target.value) || 0 } : x))}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.lastRate != null ? c.lastRate.toFixed(4) : '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <input type="checkbox" checked={c.active} onChange={(e) => { setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, active: e.target.checked } : x)); saveToggleActive(c.code, e.target.checked) }} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="defaultCurrency" checked={selectedDefault === c.code} onChange={() => setSelectedDefault(c.code)} />
                    <button className="btn btn-sm" onClick={() => setDefault(c.code)} disabled={loading || selectedDefault !== c.code}>{selectedDefault === c.code ? 'Set Default' : 'Select'}</button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => saveCurrency(c.code)} disabled={loading}>Save</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
