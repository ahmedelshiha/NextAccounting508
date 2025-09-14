import React from 'react'
import { Badge } from '@/components/ui/badge'

interface TaskTagsProps { tags: string[]; maxVisible?: number }

export const TaskTags: React.FC<TaskTagsProps> = ({ tags, maxVisible = 3 }) => {
  if (!tags.length) return null
  const visibleTags = tags.slice(0, maxVisible)
  const remainingCount = tags.length - maxVisible
  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map(tag => (<Badge key={tag} variant="secondary" className="text-xs px-1 py-0">{tag}</Badge>))}
      {remainingCount > 0 && (<Badge variant="secondary" className="text-xs px-1 py-0">+{remainingCount}</Badge>)}
    </div>
  )
}
