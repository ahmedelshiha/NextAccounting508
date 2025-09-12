'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

interface VirtualizedListProps<T> {
  tasks: T[]
  itemHeight?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export default function VirtualizedTaskList<T>({ tasks, itemHeight = 320, overscan = 3, renderItem }: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [columns, setColumns] = useState(1)

  const updateColumns = useCallback(() => {
    if (typeof window === 'undefined') return
    const w = window.innerWidth
    if (w >= 1280) setColumns(3)
    else if (w >= 1024) setColumns(2)
    else setColumns(1)
  }, [])

  useEffect(() => {
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [updateColumns])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const rowCount = Math.max(1, Math.ceil(tasks.length / columns))
  const totalHeight = rowCount * itemHeight

  const viewportHeight = containerRef.current?.clientHeight || 600
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleRows = Math.ceil(viewportHeight / itemHeight) + overscan * 2
  const endRow = Math.min(rowCount, startRow + visibleRows)

  const items: Array<{ item: T; index: number; top: number; left: number }> = []
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const idx = row * columns + col
      if (idx >= tasks.length) break
      items.push({ item: tasks[idx], index: idx, top: row * itemHeight, left: (col / columns) * 100 })
    }
  }

  return (
    <div ref={containerRef} className="relative overflow-auto" style={{ height: '70vh' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.map(({ item, index, top, left }) => (
          <div
            key={(item as any).id ?? index}
            style={{
              position: 'absolute',
              top,
              left: `${left}%`,
              width: `${100 / columns}%`,
              padding: 8,
              boxSizing: 'border-box',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}
