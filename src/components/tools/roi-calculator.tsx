"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function toNumber(v: string) { const n = Number(v.replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0 }

export function ROICalculator() {
  const [cost, setCost] = useState('299')
  const [monthlyBenefit, setMonthlyBenefit] = useState('600')
  const [months, setMonths] = useState('12')

  const result = useMemo(() => {
    const c = toNumber(cost)
    const m = toNumber(monthlyBenefit)
    const n = Math.max(1, Math.round(toNumber(months)))
    const totalBenefit = m * n
    const roi = c > 0 ? ((totalBenefit - c) / c) * 100 : 0
    const breakEvenMonths = m > 0 ? Math.ceil(c / m) : Infinity
    return { totalBenefit, roi, breakEvenMonths }
  }, [cost, monthlyBenefit, months])

  const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>ROI Calculator</CardTitle>
        <CardDescription>Estimate payback period and return on investment for our services.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-700">Service Cost</label>
            <Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Monthly Benefit</label>
            <Input value={monthlyBenefit} onChange={(e) => setMonthlyBenefit(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Months</label>
            <Input value={months} onChange={(e) => setMonths(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-600">Total Benefit</div>
            <div className="text-xl font-semibold">{fmt(result.totalBenefit)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-600">ROI</div>
            <div className="text-xl font-semibold">{result.roi.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-600">Break‑even (months)</div>
            <div className="text-xl font-semibold">{Number.isFinite(result.breakEvenMonths) ? result.breakEvenMonths : 'N/A'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
