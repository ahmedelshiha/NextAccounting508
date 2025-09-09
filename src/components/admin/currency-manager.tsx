'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/use-permissions'

type Currency = { code: string; name: string; symbol?: string | null; decimals: number; active: boolean; isDefault: boolean; lastRate?: number | null }
type PriceOverride = { id: number; entity: string; entityId: string; currencyCode: string; priceCents: number; note?: string | null }

export default function CurrencyManager() {
  const perms = usePermissions()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // override state
  const [entity, setEntity] = useState<'services' | 'products'>('services')
  const [entityId, setEntityId] = useState('')
  const [overrides, setOverrides] = useState<PriceOverride[]>([])
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/currencies')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setCurrencies(json)
      const def = json.find((c: Currency) => c.isDefault)
      setSelectedDefault(def?.code ?? null)
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      toast.error('Failed to update')
    }
    setLoading(false)
  }

  // overrides
  async function loadOverrides() {
    if (!entityId) return
    setOverrideLoading(true)
    try {
      const res = await fetch(`/api/admin/currencies/overrides?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(entityId)}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setOverrides(json)
    } catch {
      toast.error('Failed to load overrides')
    }
    setOverrideLoading(false)
  }

  function formatAmountFromCents(cents: number, decimals = 2) { return (cents/100).toFixed(decimals) }
  function parseAmountToCents(amountStr: string, _decimals = 2) { const n = Number(amountStr); if (Number.isNaN(n)) return 0; return Math.round(n * 100) }

  async function saveOverride(id: number | null, currencyCode: string, priceStr: string, note?: string) {
    if (!entityId) { toast.error('Missing entity id'); return }
    const priceCents = parseAmountToCents(priceStr)
    try {
      const res = await fetch('/api/admin/currencies/overrides', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entity, entityId, currencyCode, priceCents, note }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Saved override')
      await loadOverrides()
    } catch {
      toast.error('Failed to save override')
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Manage Currencies</h2>
          <p className="text-sm text-gray-600">Edit currencies, set default, refresh rates, and manage per-entity price overrides.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={refreshRates} disabled={loading}>Refresh rates</button>
          <button className="btn" onClick={() => { window.location.href = '/api/admin/currencies/export' }}>Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="space-y-2 max-h-[480px] overflow-auto">
            {currencies.map((c) => (
              <div key={c.code} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.code})</span></div>
                    <div className="text-xs text-gray-500">{c.isDefault ? 'Default' : ''}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 items-center">
                    <div>
                      <label className="text-xs text-gray-600">Symbol</label>
                      <input className="block w-full border rounded px-2 py-1 text-sm" value={c.symbol ?? ''} onChange={(e) => setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, symbol: e.target.value } : x))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Decimals</label>
                      <input type="number" className="block w-full border rounded px-2 py-1 text-sm" value={c.decimals} onChange={(e) => setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, decimals: Number(e.target.value) || 0 } : x))} />
                    </div>
                    <div className="flex items-end space-x-2">
                      <label className="text-xs text-gray-600">Active</label>
                      <input type="checkbox" checked={c.active} onChange={(e) => setCurrencies(prev => prev.map(x => x.code === c.code ? { ...x, active: e.target.checked } : x))} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="defaultCurrency" checked={selectedDefault === c.code} onChange={() => setSelectedDefault(c.code)} />
                    <button className="btn btn-sm" onClick={() => setDefault(c.code)} disabled={loading || selectedDefault !== c.code}>{selectedDefault === c.code ? 'Set Default' : 'Select'}</button>
                  </div>
                  <div>
                    <button className="btn btn-ghost btn-sm" onClick={() => saveCurrency(c.code)} disabled={loading}>Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {perms.canManagePriceOverrides && (
            <div>
              <h3 className="text-md font-medium mb-2">Per-entity Price Overrides</h3>
              <div className="flex items-center gap-2 mb-3">
                <select value={entity} onChange={(e) => setEntity(e.target.value as 'services' | 'products')} className="border rounded px-2 py-1 text-sm">
                  <option value="services">Service</option>
                  <option value="products">Product</option>
                </select>
                <input placeholder="Entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <button className="btn btn-sm" onClick={loadOverrides} disabled={overrideLoading}>Load Overrides</button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-auto">
                {overrides.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{o.currencyCode}</div>
                      <div className="text-xs text-gray-600">{o.note ?? ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input defaultValue={formatAmountFromCents(o.priceCents)} className="border rounded px-2 py-1 text-sm w-28" id={`price-${o.id}`} />
                      <button className="btn btn-sm" onClick={() => { const el = document.getElementById(`price-${o.id}`) as HTMLInputElement | null; if (!el) return; saveOverride(o.id, o.currencyCode, el.value, o.note ?? '') }}>Save</button>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <div className="text-sm text-gray-700 mb-2">Create / Update Override</div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <select id="new-currency" className="border rounded px-2 py-1 text-sm">
                      {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                    <input id="new-price" placeholder="Amount" className="border rounded px-2 py-1 text-sm" />
                    <button className="btn btn-sm" onClick={() => { const curEl = document.getElementById('new-currency') as HTMLSelectElement | null; const priceEl = document.getElementById('new-price') as HTMLInputElement | null; if (!curEl || !priceEl) return; saveOverride(null, curEl.value, priceEl.value) }}>Save Override</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
