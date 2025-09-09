"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'
import { useCurrency } from '@/components/providers/currency-provider'
import { SUPPORTED_CURRENCIES, convertFromUSD, formatMoney } from '@/lib/currency'

interface Service {
  id: string
  name: string
  slug: string
  shortDesc?: string | null
  description: string
  price?: number | null
  duration?: number | null
  featured: boolean
  active: boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const { currency, setCurrency } = useCurrency()

  // Create form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [featured, setFeatured] = useState(false)
  const [image, setImage] = useState('')
  const [priceSAR, setPriceSAR] = useState('')
  const [priceAED, setPriceAED] = useState('')
  const [priceEGP, setPriceEGP] = useState('')

  // Edit form state
  const [selected, setSelected] = useState<Service | null>(null)
  const [editName, setEditName] = useState('')
  const [editShortDesc, setEditShortDesc] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editActive, setEditActive] = useState(true)
  const [editImage, setEditImage] = useState('')
  const [editPriceSAR, setEditPriceSAR] = useState('')
  const [editPriceAED, setEditPriceAED] = useState('')
  const [editPriceEGP, setEditPriceEGP] = useState('')

  async function load() {
    try {
      const res = await apiFetch('/api/admin/services')
      if (res.ok) setServices(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const createService = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      name,
      slug,
      description,
      shortDesc,
      features: [],
      price: price ? Number(price) : null,
      duration: duration ? Number(duration) : null,
      category: undefined,
      featured,
      image: undefined,
    }
    const res = await apiFetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, image: image || null, prices: { SAR: priceSAR ? Number(priceSAR) : null, AED: priceAED ? Number(priceAED) : null, EGP: priceEGP ? Number(priceEGP) : null } })
    })
    if (res.ok) {
      setName(''); setSlug(''); setDescription(''); setShortDesc(''); setPrice(''); setDuration(''); setFeatured(false); setImage(''); setPriceSAR(''); setPriceAED(''); setPriceEGP('')
      load()
    }
  }

  const selectService = (s: Service) => {
    setSelected(s)
    setEditName(s.name)
    setEditShortDesc(s.shortDesc || '')
    setEditDescription(s.description || '')
    setEditPrice(typeof s.price === 'number' ? String(s.price) : s.price ? String(s.price) : '')
    setEditDuration(s.duration ? String(s.duration) : '')
    setEditFeatured(!!s.featured)
    setEditActive(!!s.active)
    setEditImage((s as any).image || '')
    const prices = (s as any).prices as Array<{ currency: string; amount: number }> | undefined
    setEditPriceSAR(String(prices?.find(p => p.currency === 'SAR')?.amount ?? ''))
    setEditPriceAED(String(prices?.find(p => p.currency === 'AED')?.amount ?? ''))
    setEditPriceEGP(String(prices?.find(p => p.currency === 'EGP')?.amount ?? ''))
  }

  const saveEdits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const res = await apiFetch(`/api/services/${encodeURIComponent(selected.slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        shortDesc: editShortDesc,
        price: editPrice ? Number(editPrice) : null,
        duration: editDuration ? Number(editDuration) : null,
        featured: editFeatured,
        active: editActive,
        image: editImage || null,
        prices: {
          SAR: editPriceSAR ? Number(editPriceSAR) : null,
          AED: editPriceAED ? Number(editPriceAED) : null,
          EGP: editPriceEGP ? Number(editPriceEGP) : null,
        }
      })
    })
    if (res.ok) {
      setSelected(null)
      load()
    }
  }

  const _toggleActive = async () => {
    if (!selected) return
    const res = await apiFetch(`/api/services/${encodeURIComponent(selected.slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !selected.active })
    })
    if (res.ok) load()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Settings className="h-6 w-6 mr-2 text-gray-700" /> Services</h1>
          <p className="text-gray-600 mt-2">Create and manage services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Existing Services</CardTitle>
              <CardDescription>Click a service to edit or toggle status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-24" />))}
                </div>
              ) : services.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectService(s)}
                      className={`text-left p-4 border rounded-lg bg-white transition focus:outline-none ${selected?.id === s.id ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="space-x-2">
                          {s.featured && <Badge className="bg-blue-100 text-blue-800">Featured</Badge>}
                          {s.active ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 truncate">/{s.slug}</div>
                      {s.shortDesc && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{s.shortDesc}</div>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No services yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selected ? 'Edit Service' : 'Create Service'}</CardTitle>
              <CardDescription>{selected ? `Editing /${selected.slug}` : 'Add a new service'}</CardDescription>
              <div className="mt-2">
                <label className="text-xs text-gray-600 mr-2">Currency preview</label>
                <select className="border rounded px-2 py-1 text-sm" value={currency} onChange={e => setCurrency(e.target.value as any)}>
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {selected ? (
                <form onSubmit={saveEdits} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-700">Name</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Slug</label>
                    <Input value={selected.slug} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Short Description</label>
                    <Input value={editShortDesc} onChange={e => setEditShortDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Description</label>
                    <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">Price (Base USD)</label>
                      <Input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                      {editPrice && (
                        <div className="text-xs text-gray-600 mt-1">Preview: {formatMoney(convertFromUSD(Number(editPrice || 0), currency), currency)}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Duration (min)</label>
                      <Input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">SAR Override</label>
                      <Input type="number" step="0.01" value={editPriceSAR} onChange={e => setEditPriceSAR(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">AED Override</label>
                      <Input type="number" step="0.01" value={editPriceAED} onChange={e => setEditPriceAED(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">EGP Override</label>
                      <Input type="number" step="0.01" value={editPriceEGP} onChange={e => setEditPriceEGP(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Image URL</label>
                    <Input value={editImage} onChange={e => setEditImage(e.target.value)} placeholder="https://..." />
                    {editImage ? (<img src={editImage} alt="Service" className="mt-2 h-24 w-full object-cover rounded" />) : null}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input id="edit-featured" type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} />
                      <label htmlFor="edit-featured" className="text-sm text-gray-700">Featured</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="edit-active" type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                      <label htmlFor="edit-active" className="text-sm text-gray-700">Active</label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="submit" className="w-full">Save Changes</Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setSelected(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={createService} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-700">Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Slug</label>
                    <Input value={slug} onChange={e => setSlug(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Short Description</label>
                    <Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Description</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">Price (Base USD)</label>
                      <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                      {price && (
                        <div className="text-xs text-gray-600 mt-1">Preview: {formatMoney(convertFromUSD(Number(price || 0), currency), currency)}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Duration (min)</label>
                      <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-700">SAR Override</label>
                      <Input type="number" step="0.01" value={priceSAR} onChange={e => setPriceSAR(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">AED Override</label>
                      <Input type="number" step="0.01" value={priceAED} onChange={e => setPriceAED(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">EGP Override</label>
                      <Input type="number" step="0.01" value={priceEGP} onChange={e => setPriceEGP(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Image URL</label>
                    <Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
                    {image ? (<img src={image} alt="Service preview" className="mt-2 h-24 w-full object-cover rounded" />) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="featured" type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                    <label htmlFor="featured" className="text-sm text-gray-700">Featured</label>
                  </div>
                  <Button type="submit" className="w-full">Create</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
