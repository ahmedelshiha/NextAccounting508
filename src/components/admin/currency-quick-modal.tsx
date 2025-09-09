'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { usePermissions } from '@/lib/use-permissions'

type Currency = { code: string; name: string; symbol?: string | null; decimals: number; active: boolean; isDefault: boolean }

type PriceOverride = { id: number; entity: string; entityId: string; currencyCode: string; priceCents: number; note?: string | null }

export default function CurrencyQuickModal() {
  const perms = usePermissions()
  const [open, setOpen] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  // overrides UI state
  const [entity, setEntity] = useState<'services' | 'products'>('services')
  const [entityId, setEntityId] = useState<string>('')
  const [overrides, setOverrides] = useState<PriceOverride[]>([])
  const [overrideLoading, setOverrideLoading] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/admin/currencies')
      if (!res.ok) throw new Error('Unauthorized')
      const json = await res.json()
      setCurrencies(json.map((c: Currency) => ({ ...c })))
      const def = json.find((c: Currency) => c.isDefault)
      setSelected(def?.code ?? null)
    } catch {
      setError('Failed to load currencies')
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  async function setDefault(code: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Default currency updated')
      await load()
      setOpen(false)
    } catch {
      setError('Failed to set default')
      toast.error('Failed to set default currency')
    }
    setLoading(false)
  }

  async function saveCurrency(code: string) {
    const cur = currencies.find((c) => c.code === code)
    if (!cur) return
    setLoading(true)
    try {
      const payload: Record<string, unknown> = { symbol: cur.symbol ?? null, decimals: cur.decimals, active: cur.active }
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to save')
      toast.success(`Saved ${code}`)
      await load()
    } catch {
      toast.error(`Failed to save ${code}`)
    }
    setLoading(false)
  }

  function updateField(code: string, field: 'symbol' | 'decimals' | 'active', value: string | number | boolean) {
    setCurrencies((prev) => prev.map((c) => (c.code === code ? { ...c, [field]: value } : c)))
  }

  // Overrides
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

  function formatAmountFromCents(cents: number, decimals = 2) {
    return (cents / 100).toFixed(decimals)
  }

  function parseAmountToCents(amountStr: string, _decimals = 2) {
    const n = Number(amountStr)
    if (Number.isNaN(n)) return 0
    return Math.round(n * 100)
  }

  async function saveOverride(id: number | null, currencyCode: string, priceStr: string, note?: string) {
    if (!entityId) { toast.error('Missing entity id'); return }
    const priceCents = parseAmountToCents(priceStr)
    try {
      const res = await fetch('/api/admin/currencies/overrides', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entity, entityId, currencyCode, priceCents, note }) })
      if (!res.ok) throw new Error('Failed')
      toast.success('Saved override')
      await loadOverrides()
    } catch (e) {
      toast.error('Failed to save override')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Quick Change Currency</Button>
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Change Site Currency</DialogTitle>
          <DialogDescription>Pick default currency for the site. This sets the site base/default currency used for display and conversions. You can also edit symbol, decimals, and toggle active state here, and manage per-entity price overrides.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            <div className="space-y-2 max-h-48 overflow-auto">
              {currencies.map((c) => (
                <div key={c.code} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.code})</span></div>
                      <div className="text-xs text-gray-500">{c.isDefault ? 'Default' : ''}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 items-center">
                      <div>
                        <label className="text-xs text-gray-600">Symbol</label>
                        <input className="block w-full border rounded px-2 py-1 text-sm" value={c.symbol ?? ''} onChange={(e) => updateField(c.code, 'symbol', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Decimals</label>
                        <input type="number" className="block w-full border rounded px-2 py-1 text-sm" value={c.decimals} onChange={(e) => updateField(c.code, 'decimals', Number(e.target.value) || 0)} />
                      </div>
                      <div className="flex items-end space-x-2">
                        <label className="text-xs text-gray-600">Active</label>
                        <input type="checkbox" checked={c.active} onChange={(e) => updateField(c.code, 'active', e.target.checked)} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input type="radio" name="defaultCurrency" checked={selected === c.code} onChange={() => setSelected(c.code)} />
                      <Button size="sm" onClick={() => setDefault(c.code)} disabled={loading || selected !== c.code}>{selected === c.code ? 'Set Default' : 'Select'}</Button>
                    </div>
                    <div>
                      <Button size="sm" variant="secondary" onClick={() => saveCurrency(c.code)} disabled={loading}>Save</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {perms.canManagePriceOverrides && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm">Entity</label>
                <select value={entity} onChange={(e) => setEntity(e.target.value as 'services' | 'products')} className="border rounded px-2 py-1 text-sm">
                  <option value="services">Service</option>
                  <option value="products">Product</option>
                </select>
                <input placeholder="Entity ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <Button size="sm" onClick={loadOverrides} disabled={overrideLoading}>Load Overrides</Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-auto">
                {overrides.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{o.currencyCode}</div>
                      <div className="text-xs text-gray-600">{o.note ?? ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input defaultValue={formatAmountFromCents(o.priceCents)} className="border rounded px-2 py-1 text-sm w-28" id={`price-${o.id}`} />
                      <Button size="sm" onClick={() => {
                        const el = document.getElementById(`price-${o.id}`) as HTMLInputElement | null
                        if (!el) return
                        saveOverride(o.id, o.currencyCode, el.value, o.note ?? '')
                      }}>Save</Button>
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
                    <Button size="sm" onClick={() => {
                      const curEl = document.getElementById('new-currency') as HTMLSelectElement | null
                      const priceEl = document.getElementById('new-price') as HTMLInputElement | null
                      if (!curEl || !priceEl) return
                      saveOverride(null, curEl.value, priceEl.value)
                    }}>Save Override</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
