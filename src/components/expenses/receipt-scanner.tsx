"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { trackEvent } from "@/lib/analytics"
import { toast } from "sonner"

interface ExtractedFields {
  merchant: string
  date: string // ISO yyyy-mm-dd
  total: number
  tax: number
  currency: string
  category: string
  notes?: string
}

function simulateExtract(file: File): ExtractedFields {
  const name = file.name || "receipt"
  const match = name.match(/(\d+[.,]?\d{0,2})/)
  const numberFromName = match ? Number(String(match[1]).replace(",", ".")) : 0
  const today = new Date()
  const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return {
    merchant: name.replace(/\.[^.]+$/, "").replace(/[\-_]/g, " ").slice(0, 60) || "General Store",
    date: iso,
    total: Number.isFinite(numberFromName) ? Number(numberFromName.toFixed(2)) : 0,
    tax: 0,
    currency: "USD",
    category: "general",
    notes: ""
  }
}

export default function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fields, setFields] = useState<ExtractedFields | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    trackEvent("receipt_opened", {})
  }, [])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setFields(simulateExtract(file))
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canSave = useMemo(() => !!file && !!fields && fields.merchant && fields.date && fields.total >= 0, [file, fields])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) {
      toast.error("File too large (max 8MB)")
      return
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"]
    if (!allowed.includes(f.type)) {
      toast.error("Unsupported file type")
      return
    }
    setFile(f)
  }

  const onChangeField = (key: keyof ExtractedFields, value: string) => {
    if (!fields) return
    if (key === "total" || key === "tax") {
      const n = Number(value)
      setFields({ ...fields, [key]: Number.isFinite(n) ? n : 0 })
    } else {
      setFields({ ...fields, [key]: value })
    }
  }

  const onSave = async () => {
    if (!file || !fields) return
    setSaving(true)
    try {
      const res = await fetch("/api/expenses/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          size: file.size,
          contentType: file.type,
          fields,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Failed to save")
      }
      const json = await res.json().catch(() => ({}))
      trackEvent("receipt_saved", { id: json?.data?.id, amount: fields.total, currency: fields.currency })
      toast.success("Receipt saved")
      setFile(null)
      setPreviewUrl(null)
      setFields(null)
    } catch (e: any) {
      toast.error(e?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan Receipt</CardTitle>
          <CardDescription>Upload a photo or PDF. We’ll extract key details for review before saving.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 space-y-3">
              <Label htmlFor="receipt-file">Receipt File</Label>
              <Input id="receipt-file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onSelectFile} aria-label="Upload receipt" />
              {previewUrl ? (
                file?.type.startsWith("image/") ? (
                  <div className="relative w-full max-w-sm aspect-[4/3] overflow-hidden rounded-md border">
                    <Image src={previewUrl} alt={file?.name || "Receipt preview"} fill className="object-contain bg-white" />
                  </div>
                ) : (
                  <div className="p-3 border rounded-md text-sm text-gray-700 bg-gray-50">{file?.name} ({Math.round((file!.size/1024)*10)/10} KB)</div>
                )
              ) : (
                <div className="p-3 border rounded-md text-sm text-gray-600 bg-gray-50">No file selected</div>
              )}
            </div>

            <div className="md:w-1/2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input id="merchant" value={fields?.merchant || ""} onChange={(e) => onChangeField("merchant", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={fields?.date || ""} onChange={(e) => onChangeField("date", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input id="total" type="number" step="0.01" value={fields?.total ?? ""} onChange={(e) => onChangeField("total", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input id="tax" type="number" step="0.01" value={fields?.tax ?? ""} onChange={(e) => onChangeField("tax", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={fields?.currency || "USD"} onChange={(e) => onChangeField("currency", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={fields?.category || "general"} onChange={(e) => onChangeField("category", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={fields?.notes || ""} onChange={(e) => onChangeField("notes", e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={onSave} disabled={!canSave || saving} aria-label="Save receipt">
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
