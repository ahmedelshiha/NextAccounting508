"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Slash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useSettingsSearchIndex } from '@/hooks/admin/useSettingsSearchIndex'

export default function SettingsSearch({ className = '' }: { className?: string }) {
  const { fuse, items } = useSettingsSearchIndex()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const results = useMemo(() => {
    const base = query.trim() ? fuse.search(query).map((r) => r.item) : items
    return category === 'all' ? base.slice(0, 10) : base.filter((i) => i.category === category).slice(0, 10)
  }, [query, category, fuse, items])

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const go = useCallback((idx: number) => {
    const item = results[idx]
    if (!item) return
    router.push(item.route)
    setOpen(false)
  }, [results, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))
      if (isModK) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0))
      if (e.key === 'Enter') go(activeIndex)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, go, open, results.length])

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(0) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search settings…"
          aria-label="Search settings"
          className="pl-8"
        />
        <div className="pointer-events-none absolute right-2 top-2 text-xs text-muted-foreground flex items-center gap-0.5">
          <Slash className="h-3 w-3" />K
        </div>

        {open && results.length > 0 && (
          <div role="listbox" className="absolute z-40 mt-1 w-full rounded-md border bg-white shadow-sm">
            {results.map((r, idx) => (
              <button
                key={r.key}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => { e.preventDefault(); go(idx) }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-gray-50', idx === activeIndex ? 'bg-gray-50' : '')}
              >
                <div className="font-medium text-gray-800 truncate">{r.label}</div>
                <div className="text-xs text-gray-500 truncate">{r.route}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-40">
        <Select value={category} onValueChange={(v) => setCategory(v as any)}>
          <SelectTrigger aria-label="Filter category">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {items.map((i) => (
              <SelectItem key={i.key} value={i.category}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
