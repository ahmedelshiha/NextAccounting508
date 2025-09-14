import React from 'react'

export const TaskTags: React.FC<{ tags: string[]; maxVisible?: number }> = ({ tags, maxVisible = 3 }) => {
  const visible = tags.slice(0, maxVisible)
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(t => <span key={t} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t}</span>)}
      {tags.length > maxVisible && <span className="text-xs text-gray-500">+{tags.length - maxVisible}</span>}
    </div>
  )
}
