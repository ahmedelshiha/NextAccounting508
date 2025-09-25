"use client"

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

export type PriceComponent = { code: string; label: string; amountCents: number }
export type PriceBreakdown = { currency: string; baseCents: number; components: PriceComponent[]; subtotalCents: number; totalCents: number }

export type PaymentStepProps = {
  serviceId?: string | null
  dateISO?: string | null
  time?: string | null
  durationMinutes?: number | null
  currency: string
  promoCode?: string | null
  bookingType?: string | null
  paymentMethod?: 'CARD' | 'COD'
  onPaymentMethodChange?: (m: 'CARD' | 'COD') => void
  onApplyPromo?: (code: string) => void
  ensureServiceRequestId?: () => Promise<string | null>
}

function formatCents(cents: number, curr: string) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format((cents || 0) / 100) } catch { return `$${(cents/100).toFixed(2)}` }
}

export default function PaymentStep(props: PaymentStepProps) {
  const [loading, setLoading] = useState(false)
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)
  const [promoInput, setPromoInput] = useState<string>(props.promoCode || '')

  const canQuote = useMemo(() => !!props.serviceId && !!props.dateISO && !!props.time, [props.serviceId, props.dateISO, props.time])

  useEffect(() => { setPromoInput(props.promoCode || '') }, [props.promoCode])

  async function loadPricing() {
    if (!canQuote) return
    setLoading(true)
    setBreakdown(null)
    try {
      const scheduledAt = new Date(`${props.dateISO}T${props.time}:00`).toISOString()
      const resp = await apiFetch('/api/pricing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          serviceId: props.serviceId,
          scheduledAt,
          duration: props.durationMinutes || undefined,
          currency: props.currency,
          promoCode: (props.promoCode || '').trim() || undefined,
          bookingType: props.bookingType || undefined,
        })
      })
      const json = await resp.json().catch(() => null)
      const data = json?.data || json
      if (resp.ok && data && typeof data.totalCents === 'number') setBreakdown(data as PriceBreakdown)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPricing() }, [props.serviceId, props.dateISO, props.time, props.durationMinutes, props.currency, props.promoCode])

  const [redirecting, setRedirecting] = useState(false)
  async function startCheckout() {
    if (!breakdown || !props.serviceId || !props.dateISO || !props.time) return
    setRedirecting(true)
    try {
      const scheduledAt = new Date(`${props.dateISO}T${props.time}:00`).toISOString()
      let serviceRequestId: string | null = null
      try { serviceRequestId = (await props.ensureServiceRequestId?.()) || null } catch {}
      const resp = await apiFetch('/api/payments/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          serviceId: props.serviceId,
          scheduledAt,
          duration: props.durationMinutes || undefined,
          currency: props.currency,
          promoCode: (props.promoCode || '').trim() || undefined,
          bookingType: props.bookingType || undefined,
          serviceRequestId: serviceRequestId || undefined,
          successUrl: typeof window !== 'undefined' ? window.location.origin + '/portal' : undefined,
          cancelUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        })
      })
      const json = await resp.json().catch(() => null)
      if (resp.ok && json?.url) {
        if (typeof window !== 'undefined') window.location.href = json.url
      } else {
        alert(json?.error || 'Failed to start checkout')
      }
    } catch {
      alert('Failed to start checkout')
    } finally {
      setRedirecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment & Pricing</CardTitle>
        <p className="text-gray-600">Review the price breakdown. Apply a promo code if you have one.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Promo Code</Label>
            <div className="mt-1 flex gap-2">
              <Input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="e.g. WELCOME10" />
              <Button type="button" variant="outline" onClick={() => props.onApplyPromo?.(promoInput.trim())}>Apply</Button>
            </div>
          </div>
          <div>
            <Label>Currency</Label>
            <div className="mt-2 text-sm text-gray-700">{props.currency}</div>
          </div>
        </div>

        <div className="mt-6">
          <Label>Payment Method</Label>
          <select className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 bg-white" value={props.paymentMethod || 'CARD'} onChange={(e) => props.onPaymentMethodChange?.((e.target.value as 'CARD'|'COD'))}>
            <option value="CARD">Pay now (card)</option>
            <option value="COD">Cash on delivery</option>
          </select>
        </div>

        <div className="mt-6">
          <Label>Breakdown</Label>
          {loading && <div className="text-sm text-gray-500 mt-2">Calculating…</div>}
          {!loading && breakdown && (
            <div className="mt-2 border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Base</span>
                <span className="text-gray-900 font-medium">{formatCents(breakdown.baseCents, breakdown.currency)}</span>
              </div>
              {breakdown.components.map((c) => (
                <div key={c.code} className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-700">{c.label}</span>
                  <span className={c.amountCents >= 0 ? 'text-gray-900' : 'text-green-600'}>{formatCents(c.amountCents, breakdown.currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatCents(breakdown.subtotalCents, breakdown.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-base mt-2">
                <span className="text-gray-800 font-semibold">Total</span>
                <span className="text-blue-600 font-bold">{formatCents(breakdown.totalCents, breakdown.currency)}</span>
              </div>
              {(!props.paymentMethod || props.paymentMethod === 'CARD') && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button type="button" onClick={startCheckout} disabled={redirecting}>
                    {redirecting ? 'Redirecting…' : 'Pay now'}
                  </Button>
                </div>
              )}
              {props.paymentMethod === 'COD' && (
                <div className="mt-3 text-sm text-gray-600">You chose Cash on delivery. You will pay at the time of service.</div>
              )}
            </div>
          )}
          {!loading && !breakdown && (
            <div className="text-sm text-gray-500 mt-2">Select a date & time to see pricing.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
