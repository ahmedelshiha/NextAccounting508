"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function toNumber(v: string) { const n = Number(v.replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0 }

export function TaxCalculator() {
  const [income, setIncome] = useState('120000')
  const [deductions, setDeductions] = useState('24000')
  const [rate, setRate] = useState('24')

  const result = useMemo(() => {
    const inc = toNumber(income)
    const ded = toNumber(deductions)
    const r = toNumber(rate) / 100
    const taxable = Math.max(0, inc - ded)
    const estTax = Math.max(0, taxable * r)
    return { taxable, estTax }
  }, [income, deductions, rate])

  const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Tax Calculator</CardTitle>
        <CardDescription>Estimate federal taxes quickly. This is a simple estimate; consult a CPA for accuracy.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-700">Annual Income</label>
            <Input value={income} onChange={(e) => setIncome(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Deductions</label>
            <Input value={deductions} onChange={(e) => setDeductions(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Tax Rate %</label>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-600">Taxable Income</div>
            <div className="text-xl font-semibold">{fmt(result.taxable)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-600">Estimated Tax</div>
            <div className="text-xl font-semibold">{fmt(result.estTax)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
