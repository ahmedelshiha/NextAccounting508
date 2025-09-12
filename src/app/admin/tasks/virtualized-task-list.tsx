'use client'
import './task-accessibility.css'

'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { FixedSizeList as FixedSizeListType } from 'react-window'

interface VirtualizedListProps<T extends { id: string; title?: string }> {
  tasks: T[]
  itemHeight?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  onActivate?: (item: T, index: number) => void
}

export default function VirtualizedTaskList<T extends { id: string; title?: string }>({ tasks, itemHeight = 320, overscan = 3, renderItem, onActivate }: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<{ scrollToItem: (index: number) => void } | null>(null)
  const [width, setWidth] = useState(1200)
  const [columns, setColumns] = useState(3)
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const updateSize = useCallback(() => {
    const w = containerRef.current?.clientWidth || window.innerWidth
    setWidth(w)
    if (w >= 1280) setColumns(3)
    else if (w >= 1024) setColumns(2)
    else setColumns(1)
  }, [])

  useEffect(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [updateSize])

  useEffect(() => {
    // clamp activeIndex
    setActiveIndex((i) => Math.max(0, Math.min(i, tasks.length - 1)))
  }, [tasks.length])

  const rowCount = Math.max(1, Math.ceil(tasks.length / columns))

  const scrollToIndex = (index: number) => {
    const row = Math.floor(index / columns)
    if (listRef.current && typeof listRef.current.scrollToItem === 'function') {
      listRef.current.scrollToItem(row)
    }
  }

  const [announcement, setAnnouncement] = useState<string>('')

  const activeIndexRef = useRef<number>(activeIndex)
  React.useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (tasks.length === 0) return
    let handled = false
    const cur = activeIndexRef.current
    if (e.key === 'ArrowDown') {
      const next = Math.min(cur + 1, tasks.length - 1)
      setActiveIndex(next)
      setAnnouncement(`Focused ${getTaskTitle(next)}`)
      scrollToIndex(next)
      handled = true
    } else if (e.key === 'ArrowUp') {
      const next = Math.max(cur - 1, 0)
      setActiveIndex(next)
      setAnnouncement(`Focused ${getTaskTitle(next)}`)
      scrollToIndex(next)
      handled = true
    } else if (e.key === 'Home') {
      const next = 0
      setActiveIndex(next); scrollToIndex(next); setAnnouncement(`Focused ${getTaskTitle(next)}`); handled = true
    } else if (e.key === 'End') {
      const next = tasks.length - 1
      setActiveIndex(next); scrollToIndex(next); setAnnouncement(`Focused ${getTaskTitle(next)}`); handled = true
    } else if (e.key === 'PageDown') {
      const visibleRows = Math.max(1, Math.floor((window.innerHeight * 0.7) / itemHeight))
      const delta = visibleRows * columns
      const next = Math.min(cur + delta, tasks.length - 1)
      setActiveIndex(next)
      setAnnouncement(`Focused ${getTaskTitle(next)}`)
      scrollToIndex(next)
      handled = true
    } else if (e.key === 'PageUp') {
      const visibleRows = Math.max(1, Math.floor((window.innerHeight * 0.7) / itemHeight))
      const delta = visibleRows * columns
      const next = Math.max(cur - delta, 0)
      setActiveIndex(next)
      setAnnouncement(`Focused ${getTaskTitle(next)}`)
      scrollToIndex(next)
      handled = true
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const item = tasks[activeIndexRef.current]
      if (item) {
        setAnnouncement(`${getTaskTitle(activeIndexRef.current)} activated`)
        if (onActivate) onActivate(item, activeIndexRef.current)
        const el = document.getElementById(`task-item-${(item as { id: string }).id}`) as HTMLElement | null
        el?.focus()
      }
      handled = true
    }

    if (handled) e.preventDefault()
  }

  const getTaskTitle = (index: number) => {
    const t = tasks[index]
    if (!t) return 'item'
    return (t as { title?: string }).title || `item ${index + 1}`
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const items: Array<{ item: T; idx: number }> = []
    for (let col = 0; col < columns; col++) {
      const idx = index * columns + col
      if (idx >= tasks.length) break
      items.push({ item: tasks[idx], idx })
    }

    return (
      <div style={{ ...style, display: 'flex', gap: 12, padding: 8, boxSizing: 'border-box' }}>
        {items.map(({ item, idx }) => (
          <div key={(item as { id: string }).id ?? idx} style={{ width: `${100 / columns}%` }}>
            <div
              id={`task-item-${(item as { id: string }).id ?? idx}`}
              role="option"
              aria-selected={activeIndex === idx}
              tabIndex={-1}
            >
              {renderItem(item, idx)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: '70vh' }}>
      <div
        role="listbox"
        aria-label="Tasks"
        aria-activedescendant={tasks[activeIndex] ? `task-item-${(tasks[activeIndex] as { id: string }).id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="h-full outline-none"
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region">{announcement}</div>
        <List
          ref={listRef}
          height={Math.min(window.innerHeight * 0.7, 1200)}
          itemCount={rowCount}
          itemSize={itemHeight}
          width={width}
          overscanCount={overscan}
        >
          {Row}
        </List>
      </div>
    </div>
  )
}
