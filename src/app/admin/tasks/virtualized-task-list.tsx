'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'

interface VirtualizedListProps<T> {
  tasks: T[]
  itemHeight?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export default function VirtualizedTaskList<T>({ tasks, itemHeight = 320, overscan = 3, renderItem }: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(1200)
  const [columns, setColumns] = useState(3)

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

  const rowCount = Math.max(1, Math.ceil(tasks.length / columns))

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
          <div key={(item as any).id ?? idx} style={{ width: `${100 / columns}%` }}>
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: '70vh' }}>
      <List
        height={Math.min(window.innerHeight * 0.7, 1200)}
        itemCount={rowCount}
        itemSize={itemHeight}
        width={width}
        overscanCount={overscan}
      >
        {Row}
      </List>
    </div>
  )
}
