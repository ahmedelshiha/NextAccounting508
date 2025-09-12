'use client'

import React, { useState, useRef } from 'react'
import BoardView, { TaskStatus } from './board-view'

export default function BoardAccessible<T extends { id: string; status: TaskStatus }>(props: {
  tasks: T[]
  onMove: (id: string, status: TaskStatus) => void
  onReorder?: (id: string, status: TaskStatus, index: number) => void
  renderCard: (task: T) => React.ReactNode
}) {
  const { tasks, onMove, onReorder, renderCard } = props
  const [picked, setPicked] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // keyboard handlers: focus card, press Space to pick up, arrow keys to move between columns/positions, Enter to drop
  const onCardKeyDown = (e: React.KeyboardEvent, taskId: string, status: TaskStatus, index: number) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      setPicked((p) => (p === taskId ? null : taskId))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (picked) {
        // drop picked at this card's position
        if (onReorder) onReorder(picked, status, index)
        else onMove(picked, status)
        setPicked(null)
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      // move focus to next/previous column card if present
      const cols = ['pending','in_progress','review','completed','blocked'] as TaskStatus[]
      const curCol = status
      const curIdx = cols.indexOf(curCol)
      const nextIdx = e.key === 'ArrowRight' ? Math.min(cols.length - 1, curIdx + 1) : Math.max(0, curIdx - 1)
      const nextCol = cols[nextIdx]
      // find a card in nextCol near same index
      const candidates = tasks.filter((t) => t.status === nextCol)
      const target = candidates[Math.min(index, candidates.length - 1)]
      if (target) {
        const el = ref.current?.querySelector(`[data-task-id="${target.id}"]`) as HTMLElement | null
        el?.focus()
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      // move focus within the same column
      const column = tasks.filter((t) => t.status === status)
      const newIndex = e.key === 'ArrowUp' ? Math.max(0, index - 1) : Math.min(column.length - 1, index + 1)
      const target = column[newIndex]
      if (target) {
        const el = ref.current?.querySelector(`[data-task-id="${target.id}"]`) as HTMLElement | null
        el?.focus()
      }
    }
  }

  // render custom cards wrapping renderCard to add accessibility attributes
  const renderWrappedCard = (t: any, idx: number) => (
    <div
      data-task-id={t.id}
      tabIndex={0}
      role="button"
      aria-pressed={picked === t.id}
      aria-label={`Task ${t.title}. Priority ${t.priority || 'medium'}. Press space to ${picked === t.id ? 'drop' : 'pick up'}.`}
      onKeyDown={(e) => onCardKeyDown(e, t.id, t.status, idx)}
      className={`focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 ${picked === t.id ? 'ring-2 ring-indigo-300' : ''}`}
      onDoubleClick={() => {
        // double click toggles pick/drop
        setPicked((p) => (p === t.id ? null : t.id))
      }}
      onClick={() => {
        // clicking while picked will drop
        if (picked && picked !== t.id) {
          if (onReorder) onReorder(picked, t.status, idx)
          else onMove(picked, t.status)
          setPicked(null)
        }
      }}
    >
      {renderCard(t)}
    </div>
  )

  return (
    <div ref={ref}>
      <div className="sr-only">Use arrow keys to navigate cards, space to pick up, enter to drop.</div>
      <BoardView
        tasks={tasks}
        onMove={onMove}
        onReorder={onReorder}
        renderCard={(task) => renderWrappedCard(task as any, tasks.filter((x) => x.status === (task as any).status).indexOf(task as any))}
      />
    </div>
  )
}
