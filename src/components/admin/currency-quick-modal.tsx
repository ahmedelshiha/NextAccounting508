'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Currency = { code: string; name: string; symbol?: string | null; decimals: number; active: boolean; isDefault: boolean }

export default function CurrencyQuickModal() {
  const [open, setOpen] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/currencies')
      if (!res.ok) throw new Error('Unauthorized')
      const json = await res.json()
      setCurrencies(json)
      const def = json.find((c: Currency) => c.isDefault)
      setSelected(def?.code ?? null)
    } catch (e) {
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
      await load()
      setOpen(false)
    } catch (e) {
      setError('Failed to set default')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Quick Change Currency</Button>
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Change Site Currency</DialogTitle>
          <DialogDescription>Pick default currency for the site. This sets the site base/default currency used for display and conversions.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <div className="space-y-2 max-h-64 overflow-auto">
            {currencies.map((c) => (
              <div key={c.code} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{c.name} <span className="text-xs text-gray-500">({c.code})</span></div>
                  <div className="text-xs text-gray-500">{c.symbol ?? ''} • decimals: {c.decimals} • {c.active ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" name="defaultCurrency" checked={selected === c.code} onChange={() => setSelected(c.code)} />
                  <Button size="sm" onClick={() => setDefault(c.code)} disabled={loading || selected !== c.code}>{selected === c.code ? 'Set Default' : 'Select'}</Button>
                </div>
              </div>
            ))}
          </div>
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
