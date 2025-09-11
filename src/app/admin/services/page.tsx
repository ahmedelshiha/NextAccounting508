"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Plus,
  Search,
  Eye,
  EyeOff,
  TrendingUp,
  Star,
  RefreshCw,
  Edit3,
  Save,
  Trash2,
  Copy,
  DollarSign,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

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
  category?: string | null
  createdAt?: string
  updatedAt?: string
}

interface AnalyticsData {
  dailyBookings: { label: string; count: number }[]
  revenueByService: { service: string; amount: number }[]
  avgLeadTimeDays: number
  topServices: { service: string; bookings: number }[]
}

type AnalyticsRange = '7d' | '14d' | '30d' | '90d' | '1y'

type ViewMode = 'grid' | 'table'

export default function EnhancedServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('14d')

  const analyticsMaxBookings = useMemo(() => {
    return Math.max(1, ...(analytics?.dailyBookings.map(d => d.count || 0) || [1]))
  }, [analytics])
  const analyticsMaxRevenue = useMemo(() => {
    return Math.max(1, ...(analytics?.revenueByService.map(r => r.amount || 0) || [1]))
  }, [analytics])

  // Stats
  const stats = useMemo(() => {
    const total = services.length
    const active = services.filter(s => s.active).length
    const featured = services.filter(s => s.featured).length
    const priced = services.filter(s => typeof s.price === 'number')
    const avgPrice = priced.length ? priced.reduce((a, s) => a + Number(s.price || 0), 0) / priced.length : 0
    return { total, active, featured, avgPrice }
  }, [services])

  // View/filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [onlyFeatured, setOnlyFeatured] = useState<'all' | 'featured' | 'non'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  // Create form
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [featured, setFeatured] = useState(false)
  const [category, setCategory] = useState('')

  // Edit form
  const [selected, setSelected] = useState<Service | null>(null)
  const [editName, setEditName] = useState('')
  const [editShortDesc, setEditShortDesc] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editActive, setEditActive] = useState(true)
  const [editCategory, setEditCategory] = useState('')

  // Currency converter
  const [showConverter, setShowConverter] = useState(false)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [conversionRate, setConversionRate] = useState<number | null>(null)
  const [previewCount, setPreviewCount] = useState(0)

  async function load(initial = false) {
    try {
      if (initial) setLoading(true)
      const qp = new URLSearchParams()
      if (onlyFeatured === 'featured') qp.set('featured', 'true')
      if (!showInactive) qp.set('active', 'true')
      if (searchTerm) qp.set('search', searchTerm)
      const res = await apiFetch(`/api/admin/services${qp.toString() ? `?${qp.toString()}` : ''}`)
      if (!res.ok) throw new Error('Failed to load')
      const data: Service[] = await res.json()
      setServices(data)
    } catch (e) {
      console.error('load services error', e)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  async function loadAnalytics(initial = false) {
    try {
      if (initial) setAnalyticsLoading(true)
      const res = await apiFetch(`/api/admin/analytics?range=${encodeURIComponent(analyticsRange)}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const daily = (json.dailyBookings || []).map((d: any) => ({ label: d.date || String(d.day), count: Number(d.count || 0) }))
      const revenueByService = (json.revenueByService || []).map((r: any) => ({ service: String(r.service || 'Unknown'), amount: Number(r.amount || 0) }))
      const topServices = (json.topServices || []).map((t: any) => ({ service: String(t.service || 'Unknown'), bookings: Number(t.bookings || 0) }))
      const avgLeadTimeDays = Number(json.avgLeadTimeDays || 0)
      setAnalytics({ dailyBookings: daily, revenueByService, topServices, avgLeadTimeDays })
    } catch (e) {
      console.error('loadAnalytics error', e)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => { load(true) }, [])
  useEffect(() => { loadAnalytics(true) }, [])
  useEffect(() => { loadAnalytics(false) }, [analyticsRange])
  useEffect(() => {
    if (!name) return setSlug('')
    const auto = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setSlug(auto)
  }, [name])

  const filtered = useMemo(() => {
    return services.filter(s => {
      if (!showInactive && !s.active) return false
      if (onlyFeatured === 'featured' && !s.featured) return false
      if (onlyFeatured === 'non' && s.featured) return false
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.slug.toLowerCase().includes(q) && !(s.shortDesc || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [services, showInactive, onlyFeatured, categoryFilter, searchTerm])

  async function createService(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (!name || !slug || !description) {
        toast.error('Name, slug and description are required')
        return
      }
      const body = {
        name,
        slug,
        description,
        shortDesc: shortDesc || undefined,
        features: [],
        price: price ? Number(price) : null,
        duration: duration ? Number(duration) : null,
        category: category || undefined,
        featured,
        image: undefined,
      }
      const res = await apiFetch('/api/services', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Create failed')
      toast.success('Service created')
      setName(''); setSlug(''); setShortDesc(''); setDescription(''); setPrice(''); setDuration(''); setFeatured(false); setCategory('')
      await load()
    } catch (e) {
      console.error('createService error', e)
      toast.error('Failed to create service')
    }
  }

  function selectService(s: Service) {
    setSelected(s)
    setEditName(s.name)
    setEditShortDesc(s.shortDesc || '')
    setEditDescription(s.description || '')
    setEditPrice(typeof s.price === 'number' ? String(s.price) : s.price ? String(s.price) : '')
    setEditDuration(s.duration ? String(s.duration) : '')
    setEditFeatured(!!s.featured)
    setEditActive(!!s.active)
    setEditCategory(s.category || '')
  }

  async function saveEdits(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    try {
      const payload: Record<string, unknown> = {
        name: editName,
        description: editDescription,
        shortDesc: editShortDesc,
        price: editPrice ? Number(editPrice) : null,
        duration: editDuration ? Number(editDuration) : null,
        featured: editFeatured,
        active: editActive,
        category: editCategory || null,
      }
      const res = await apiFetch(`/api/services/${encodeURIComponent(selected.slug)}` , { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Service updated')
      setSelected(null)
      await load()
    } catch (e) {
      console.error('saveEdits error', e)
      toast.error('Failed to save changes')
    }
  }

  async function deleteService(slug: string) {
    if (!confirm('Delete this service?')) return
    try {
      const res = await apiFetch(`/api/services/${encodeURIComponent(slug)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Service deleted')
      if (selected?.slug === slug) setSelected(null)
      await load()
    } catch (e) {
      console.error('deleteService error', e)
      toast.error('Failed to delete')
    }
  }

  async function toggleActive(s: Service) {
    try {
      const res = await apiFetch(`/api/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: !s.active }) })
      if (!res.ok) throw new Error('Toggle failed')
      await load()
    } catch (e) {
      console.error('toggleActive error', e)
      toast.error('Failed to toggle')
    }
  }

  async function duplicateService(s: Service) {
    try {
      const baseSlug = `${s.slug}-copy-${Date.now()}`
      const body = {
        name: `${s.name} (Copy)` ,
        slug: baseSlug,
        description: s.description,
        shortDesc: s.shortDesc,
        features: [],
        price: s.price ?? null,
        duration: s.duration ?? null,
        category: s.category ?? undefined,
        featured: false,
        image: undefined,
      }
      const res = await apiFetch('/api/services', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Duplicate failed')
      toast.success('Service duplicated')
      await load()
    } catch (e) {
      console.error('duplicateService error', e)
      toast.error('Failed to duplicate')
    }
  }

  function onCheck(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  async function applyBulk() {
    if (!bulkAction || selectedIds.size === 0) return
    const ids = new Set(selectedIds)
    const toUpdate = services.filter(s => ids.has(s.id))
    try {
      if (bulkAction === 'delete') {
        if (!confirm(`Delete ${toUpdate.length} services?`)) return
        await Promise.all(toUpdate.map(s => apiFetch(`/api/services/${encodeURIComponent(s.slug)}`, { method: 'DELETE' })))
      }
      if (bulkAction === 'activate' || bulkAction === 'deactivate') {
        const active = bulkAction === 'activate'
        await Promise.all(toUpdate.map(s => apiFetch(`/api/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active }) })))
      }
      if (bulkAction === 'feature' || bulkAction === 'unfeature') {
        const featured = bulkAction === 'feature'
        await Promise.all(toUpdate.map(s => apiFetch(`/api/services/${encodeURIComponent(s.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ featured }) })))
      }
      toast.success('Bulk operation complete')
      setSelectedIds(new Set())
      setBulkAction('')
      await load()
    } catch (e) {
      console.error('applyBulk error', e)
      toast.error('Bulk operation failed')
    }
  }

  async function previewConversion() {
    if (!toCurrency || fromCurrency === toCurrency) { setConversionRate(null); setPreviewCount(0); return }
    try {
      // Try server rate; fallback to 1
      const res = await apiFetch(`/api/currencies/convert?from=${encodeURIComponent(fromCurrency)}&to=${encodeURIComponent(toCurrency)}&amount=1`)
      if (res.ok) {
        const json = await res.json()
        setConversionRate(Number(json.rate) || 1)
      } else {
        setConversionRate(1)
      }
    } catch {
      setConversionRate(1)
    }
    const count = services.filter(s => typeof s.price === 'number').length
    setPreviewCount(count)
  }

  async function applyConversion() {
    if (!conversionRate || conversionRate === 1) { setShowConverter(false); return }
    try {
      const priced = services.filter(s => typeof s.price === 'number')
      await Promise.all(priced.map(s => apiFetch(`/api/services/${encodeURIComponent(s.slug)}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ price: Number(s.price || 0) * conversionRate })
      })))
      toast.success('Prices converted')
      setShowConverter(false)
      await load()
    } catch (e) {
      console.error('applyConversion error', e)
      toast.error('Failed to convert prices')
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach(s => { if (s.category) set.add(s.category) })
    return Array.from(set)
  }, [services])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Settings className="h-6 w-6 mr-2 text-gray-700" /> Services Management</h1>
              <p className="text-gray-600 mt-2">Create, manage, and analyze your service offerings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { setShowConverter(true); setConversionRate(null); setPreviewCount(0) }} className="gap-2">
                <DollarSign className="h-4 w-4" /> Currency Converter
              </Button>
              <Button variant="outline" size="sm" onClick={() => load()} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg"><Settings className="h-5 w-5 text-blue-600" /></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">{stats.active} active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Price</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.avgPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">Across priced services</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Featured</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg"><Star className="h-5 w-5 text-yellow-600" /></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">Highlighted on site</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">All services</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Booking trends and revenue by service</CardDescription>
                </div>
                <select value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value as AnalyticsRange)} className="border rounded-md px-3 py-2 text-sm">
                  <option value="7d">Last 7 days</option>
                  <option value="14d">Last 14 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Daily bookings</div>
                    <div className="flex items-end gap-1 h-24">
                      {analytics.dailyBookings.slice(-24).map((d, idx) => (
                        <div key={idx} className="flex-1 bg-blue-200 rounded-sm" style={{ height: `${Math.max(2, Math.round((d.count / analyticsMaxBookings) * 96))}px` }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Revenue by service</div>
                    <div className="space-y-2">
                      {analytics.revenueByService.slice(0,5).map((r, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span className="truncate pr-2">{r.service}</span>
                            <span>${r.amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded">
                            <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.round((r.amount / analyticsMaxRevenue) * 100))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Top services</div>
                    <ul className="space-y-2">
                      {analytics.topServices.slice(0,5).map((t, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="truncate pr-2">{t.service}</span>
                          <span className="text-gray-700">{t.bookings} bookings</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-sm text-gray-700">Avg lead time: <span className="font-medium">{analytics.avgLeadTimeDays.toFixed(1)} days</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Analytics unavailable.</div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Search services..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
            <select value={onlyFeatured} onChange={(e) => setOnlyFeatured(e.target.value as any)} className="border rounded-md px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="featured">Featured only</option>
              <option value="non">Non-featured</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowInactive(v => !v)} className={`gap-2 ${showInactive ? 'bg-gray-100' : ''}`}>
              {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showInactive ? 'Hide inactive' : 'Show inactive'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}>{viewMode === 'grid' ? 'Table View' : 'Grid View'}</Button>
            <div className="ml-auto flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
                  <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="border rounded-md px-3 py-1 text-sm">
                    <option value="">Bulk actions</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="feature">Feature</option>
                    <option value="unfeature">Unfeature</option>
                    <option value="delete">Delete</option>
                  </select>
                  <Button size="sm" onClick={applyBulk} disabled={!bulkAction}>Apply</Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="gap-2">
                <Plus className="h-4 w-4" /> New Service
              </Button>
            </div>
          </div>
        </div>

        {showConverter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Currency Converter</CardTitle>
                <CardDescription>Convert all service prices by exchange rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
                    {['USD','EUR','GBP','CAD','AUD','EGP','SAR','AED'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full border rounded-md px-3 py-2 mt-1">
                    {['USD','EUR','GBP','CAD','AUD','EGP','SAR','AED'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={previewConversion} className="flex-1">Preview</Button>
                  <Button variant="outline" onClick={() => setShowConverter(false)}>Close</Button>
                </div>
                {conversionRate != null && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <div>Rate: 1 {fromCurrency} = {conversionRate} {toCurrency}</div>
                    <div>{previewCount} services will be updated</div>
                    <div className="mt-2 flex gap-2">
                      <Button onClick={applyConversion}>Apply Conversion</Button>
                      <Button variant="outline" onClick={() => { setConversionRate(null); setPreviewCount(0) }}>Reset</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Services ({filtered.length})</CardTitle>
              <CardDescription>Manage your catalog</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-24" />))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600">Try adjusting search and filters or create a new service below</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map(s => (
                    <div key={s.id} className={`border rounded-lg p-4 bg-white hover:shadow-md transition ${selected?.id === s.id ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={selectedIds.has(s.id)} onChange={(e) => onCheck(s.id, e.target.checked)} />
                          <div>
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-sm text-gray-600">/{s.slug}</div>
                          </div>
                        </div>
                        <div className="space-x-2">
                          {s.featured && <Badge className="bg-blue-100 text-blue-800">Featured</Badge>}
                          {s.active ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>}
                        </div>
                      </div>
                      {s.shortDesc && <div className="text-sm text-gray-700 line-clamp-2 mb-3">{s.shortDesc}</div>}
                      <div className="flex items-center justify-between text-sm text-gray-700">
                        <div>{typeof s.price === 'number' ? `$${Number(s.price).toFixed(2)}` : 'Contact for price'}</div>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => selectService(s)} aria-label="Edit"><Edit3 className="h-4 w-4" /></button>
                          <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => duplicateService(s)} aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                          <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => toggleActive(s)} aria-label="Toggle"><Save className="h-4 w-4" /></button>
                          <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => deleteService(s.slug)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-auto rounded border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Select</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Slug</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filtered.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(s.id)} onChange={(e) => onCheck(s.id, e.target.checked)} /></td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">/{s.slug}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{typeof s.price === 'number' ? `$${Number(s.price).toFixed(2)}` : '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {s.featured && <Badge className="bg-blue-100 text-blue-800">Featured</Badge>}
                              {s.active ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => selectService(s)} aria-label="Edit"><Edit3 className="h-4 w-4" /><span className="hidden sm:inline">Edit</span></button>
                              <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => duplicateService(s)} aria-label="Duplicate"><Copy className="h-4 w-4" /><span className="hidden sm:inline">Copy</span></button>
                              <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => toggleActive(s)} aria-label="Toggle"><Save className="h-4 w-4" /><span className="hidden sm:inline">Toggle</span></button>
                              <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => deleteService(s.slug)} aria-label="Delete"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete</span></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selected ? 'Edit Service' : 'Create Service'}</CardTitle>
              <CardDescription>{selected ? `Editing /${selected.slug}` : 'Add a new service'}</CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <form onSubmit={saveEdits} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Slug</label>
                    <Input value={selected.slug} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Short Description</label>
                    <Input value={editShortDesc} onChange={e => setEditShortDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                      <Input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                      <Input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-4">
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
                    <label className="text-sm font-medium text-gray-700">Service Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL Slug</label>
                    <Input value={slug} onChange={e => setSlug(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Short Description</label>
                    <Input value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price (USD)</label>
                      <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                      <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} />
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
