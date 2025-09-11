"use client"
import { useEffect, useMemo, useState, useCallback } from 'react'
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

// Lightweight SVG charts (no extra deps)
function LineAreaChart({ values, stroke = '#2563eb', fill = '#bfdbfe', height = 120 }: { values: number[]; stroke?: string; fill?: string; height?: number }) {
  const n = values.length
  const max = Math.max(1, ...values)
  const points = values.map((v, i) => ({ x: (i / Math.max(1, n - 1)) * 100, y: 100 - (v / max) * 100 }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
  const area = `M 0,100 ${points.map(p => `L ${p.x},${p.y}`).join(' ')} L 100,100 Z`
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={area} fill={fill} opacity={0.6} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={stroke}>
          <title>{values[i]}</title>
        </circle>
      ))}
    </svg>
  )
}

function HBarChart({ items, color = '#22c55e', height = 12 }: { items: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="truncate pr-2">{it.label}</span>
            <span>${it.value.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-100 rounded" style={{ height }}>
            <div className="rounded" style={{ width: `${Math.min(100, Math.round((it.value / max) * 100))}%`, height, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PieDonutChart({ items, donut = true, thickness = 12, palette }: { items: { label: string; value: number }[]; donut?: boolean; thickness?: number; palette?: string[] }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0)
  if (!total) return <div className="text-sm text-gray-600">No data</div>
  const colors = palette && palette.length ? palette : ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#14b8a6','#a855f7']
  const arcs: { start: number; end: number; color: string; label: string; value: number; pct: number }[] = []
  let acc = 0
  items.forEach((it, idx) => {
    const pct = (it.value / total)
    const start = acc
    const end = acc + pct
    arcs.push({ start, end, color: colors[idx % colors.length], label: it.label, value: it.value, pct })
    acc = end
  })
  const cx = 50, cy = 50, rOuter = 45
  const rInner = donut ? rOuter - thickness : 0

  function polarToCartesian(r: number, t: number) {
    const a = (t - 0.25) * 2 * Math.PI
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }
  function arcPath(startT: number, endT: number) {
    const start = polarToCartesian(rOuter, startT)
    const end = polarToCartesian(rOuter, endT)
    const large = endT - startT > 0.5 ? 1 : 0
    if (!donut) {
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${end.x} ${end.y} Z`
    }
    const iStart = polarToCartesian(rInner, endT)
    const iEnd = polarToCartesian(rInner, startT)
    return `M ${start.x} ${start.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${end.x} ${end.y} L ${iStart.x} ${iStart.y} A ${rInner} ${rInner} 0 ${large} 0 ${iEnd.x} ${iEnd.y} Z`
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-40 h-40">
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a.start, a.end)} fill={a.color}>
            <title>{`${a.label}: ${a.value.toLocaleString()} (${Math.round(a.pct*100)}%)`}</title>
          </path>
        ))}
        {donut && (
          <circle cx={cx} cy={cy} r={rInner - 0.5} fill="white" />
        )}
      </svg>
      <ul className="space-y-1 text-sm">
        {arcs.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block rounded-sm" style={{ backgroundColor: a.color, width: 10, height: 10 }} />
            <span className="truncate max-w-[12rem]" title={a.label}>{a.label}</span>
            <span className="text-gray-600">- {Math.round(a.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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

type FeaturedFilter = 'all' | 'featured' | 'non'

export default function EnhancedServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('14d')


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
  const [onlyFeatured, setOnlyFeatured] = useState<FeaturedFilter>('all')
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

  const load = useCallback(async (initial = false) => {
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
  }, [onlyFeatured, showInactive, searchTerm])

  const loadAnalytics = useCallback(async (initial = false) => {
    try {
      if (initial) setAnalyticsLoading(true)
      const res = await apiFetch(`/api/admin/analytics?range=${encodeURIComponent(analyticsRange)}`)
      if (!res.ok) throw new Error('Failed')
      const json: unknown = await res.json()
      type Resp = {
        dailyBookings?: unknown
        revenueByService?: unknown
        topServices?: unknown
        avgLeadTimeDays?: unknown
      }
      const resp = (json || {}) as Resp

      const daily = Array.isArray(resp.dailyBookings)
        ? resp.dailyBookings.map((d) => {
            const rec = (d ?? {}) as Record<string, unknown>
            const label = typeof rec.date === 'string' && rec.date ? rec.date : String(rec.day ?? '')
            const count = typeof rec.count === 'number' ? rec.count : typeof rec.count === 'string' ? Number(rec.count) || 0 : 0
            return { label, count }
          })
        : []

      const revenueByService = Array.isArray(resp.revenueByService)
        ? resp.revenueByService.map((r) => {
            const rec = (r ?? {}) as Record<string, unknown>
            const service = typeof rec.service === 'string' ? rec.service : 'Unknown'
            const amount = typeof rec.amount === 'number' ? rec.amount : typeof rec.amount === 'string' ? Number(rec.amount) || 0 : 0
            return { service, amount }
          })
        : []

      const topServices = Array.isArray(resp.topServices)
        ? resp.topServices.map((t) => {
            const rec = (t ?? {}) as Record<string, unknown>
            const service = typeof rec.service === 'string' ? rec.service : 'Unknown'
            const bookings = typeof rec.bookings === 'number' ? rec.bookings : typeof rec.bookings === 'string' ? Number(rec.bookings) || 0 : 0
            return { service, bookings }
          })
        : []

      const avgLeadTimeDays = typeof resp.avgLeadTimeDays === 'number'
        ? resp.avgLeadTimeDays
        : typeof resp.avgLeadTimeDays === 'string'
          ? Number(resp.avgLeadTimeDays) || 0
          : 0

      setAnalytics({ dailyBookings: daily, revenueByService, topServices, avgLeadTimeDays })
    } catch (e) {
      console.error('loadAnalytics error', e)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [analyticsRange])

  useEffect(() => { load(true) }, [load])
  useEffect(() => { loadAnalytics(true) }, [loadAnalytics])
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Daily bookings</div>
                      <LineAreaChart values={analytics.dailyBookings.slice(-30).map(d => d.count)} stroke="#2563eb" fill="#bfdbfe" height={120} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Revenue by service</div>
                      <HBarChart items={analytics.revenueByService.slice(0,5).map(r => ({ label: r.service, value: r.amount }))} color="#22c55e" height={8} />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Revenue share (donut)</div>
                      {(() => {
                        const list = [...(analytics.revenueByService || [])].sort((a,b) => b.amount - a.amount)
                        const top = list.slice(0,5)
                        const otherVal = list.slice(5).reduce((s,x)=> s + x.amount, 0)
                        const items = [...top.map(t => ({ label: t.service, value: t.amount })), ...(otherVal > 0 ? [{ label: 'Other', value: otherVal }] : [])]
                        return <PieDonutChart items={items} donut thickness={12} />
                      })()}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Service status (pie)</div>
                      {(() => {
                        const active = services.filter(s => s.active).length
                        const inactive = services.length - active
                        const items = [
                          { label: 'Active', value: active },
                          { label: 'Inactive', value: inactive }
                        ]
                        return <PieDonutChart items={items} donut={false} />
                      })()}
                    </div>
                  </div>
                </>
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
            <select value={onlyFeatured} onChange={(e) => setOnlyFeatured(e.target.value as FeaturedFilter)} className="border rounded-md px-3 py-2 text-sm">
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
