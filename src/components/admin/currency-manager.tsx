import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/use-permissions'
import { RefreshCw, Download, Save, Star, ToggleRight } from 'lucide-react'

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table (takes two-thirds) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium">Currency list</h3>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm flex items-center gap-2" onClick={refreshRates} disabled={loading} aria-label="Refresh rates">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="btn btn-sm flex items-center gap-2" onClick={() => { window.location.href = '/api/admin/currencies/export' }} aria-label="Export CSV">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {message && <div className="mb-4 text-sm text-red-600">{message}</div>}

          <div className="overflow-auto rounded border">
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
                      <button
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}
                        onClick={() => { saveToggleActive(c.code, !c.active); setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, active: !x.active } : x)) }}
                        aria-pressed={c.active}
                        aria-label={c.active ? 'Deactivate' : 'Activate'}
                      >
                        <ToggleRight className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs">{c.active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => { setSelectedDefault(c.code); setDefault(c.code) }} aria-label="Set default">
                          <Star className={`h-4 w-4 ${c.isDefault ? 'text-yellow-500' : 'text-gray-400'}`} />
                          <span className="hidden sm:inline text-xs">{c.isDefault ? 'Default' : 'Set'}</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => saveCurrency(c.code)} disabled={loading} aria-label={`Save ${c.code}`}>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Actions & Info (one-third) */}
        <aside className="lg:col-span-1">
          <div className="p-4 border rounded mb-4">
            <h4 className="font-medium mb-2">Actions</h4>
            <div className="flex flex-col gap-2">
              <button className="btn w-full flex items-center justify-center gap-2" onClick={refreshRates} disabled={loading}>
                <RefreshCw className="h-4 w-4" /> Refresh rates
              </button>
              <button className="btn w-full flex items-center justify-center gap-2" onClick={() => { window.location.href = '/api/admin/currencies/export' }}>
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">Legend</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2"><Save className="h-4 w-4 text-gray-500" /> Save changes</li>
              <li className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Default currency</li>
              <li className="flex items-center gap-2"><ToggleRight className="h-4 w-4 text-green-500" /> Active / Inactive</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
