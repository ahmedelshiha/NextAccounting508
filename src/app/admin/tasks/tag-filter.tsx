'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from './types'

export default function TagFilter({ tasks, value, onChange }: { tasks: Task[]; value?: string; onChange: (t?: string) => void }) {
  const tags = new Set<string>()
  for (const t of tasks) if (Array.isArray(t.tags)) for (const tag of t.tags) tags.add(tag)
  const list = Array.from(tags)

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={value ? 'ghost' : 'default'} onClick={() => onChange(undefined)}>All tags</Button>
      {list.map((tag) => (
        <Button key={tag} size="sm" variant={tag === value ? 'default' : 'ghost'} onClick={() => onChange(tag)}>{tag}</Button>
      ))}
    </div>
  )
}
