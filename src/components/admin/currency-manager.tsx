'use client'
import React, { useEffect, useState } from 'react'

type Currency = {
  code: string
  name: string
  symbol?: string | null
  decimals: number
  active: boolean
  isDefault: boolean
  lastRate?: number | null
}

export default function CurrencyManager({ initial }: { initial: Currency[] }) {
  const [currencies, setCurrencies] = useState<Currency[]>(initial)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refreshRates() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/currencies/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      const json = await res.json()
      if (res.ok && json.updated) {
        // refetch currencies
        await load()
        setMessage('Rates refreshed')
      } else {
        setMessage('Failed to refresh rates')
      }
    } catch (e) {
      setMessage('Failed to refresh rates')
    }
    setLoading(false)
  }

  async function toggleActive(code: string, active: boolean) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active }) })
      if (res.ok) {
        await load()
      } else {
        setMessage('Failed to update')
      }
    } catch (e) {
      setMessage('Failed to update')
    }
    setLoading(false)
  }

  async function setDefault(code: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/currencies/${code}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
      if (res.ok) await load()
      else setMessage('Failed to set default')
    } catch (e) {
      setMessage('Failed to set default')
    }
    setLoading(false)
  }

  async function load() {
    const res = await fetch('/api/admin/currencies')
    if (res.ok) {
      const json = await res.json()
      setCurrencies(json)
    }
  }

  useEffect(() => {
    // initial already provided, but revalidate on mount
    load()
  }, [])

  return (
    <div className="admin-currencies">
      <div className="controls flex gap-2 mb-4">
        <button className="btn btn-primary" onClick={refreshRates} disabled={loading}>Refresh rates</button>
        <a className="btn" href="/api/admin/currencies/export">Export CSV</a>
      </div>

      {message && <div className="mb-4 text-sm text-muted">{message}</div>}

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
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currencies.map((c) => (
            <tr key={c.code} className="border-t">
              <td className="py-2 font-medium">{c.code}</td>
              <td className="py-2">{c.name}</td>
              <td className="py-2">{c.symbol ?? '-'}</td>
              <td className="py-2">{c.decimals}</td>
              <td className="py-2">{c.lastRate ?? '-'}</td>
              <td className="py-2">
                <input type="checkbox" checked={c.active} onChange={(e) => toggleActive(c.code, e.target.checked)} />
              </td>
              <td className="py-2">{c.isDefault ? 'Yes' : 'No'}</td>
              <td className="py-2">
                {!c.isDefault && <button className="btn btn-sm" onClick={() => setDefault(c.code)}>Set default</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
