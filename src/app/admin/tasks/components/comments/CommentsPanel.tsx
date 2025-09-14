import React, { useEffect, useState } from 'react'

export default function CommentsPanel({ taskId }: { taskId?: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (!taskId) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/tasks/${taskId}/comments`)
        if (!res.ok) return
        const data = await res.json().catch(() => [])
        if (!mounted) return
        setComments(data || [])
      } catch (e) {
        // ignore
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [taskId])

  const handlePost = async () => {
    if (!taskId || !value.trim()) return
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: value }) })
      if (!res.ok) throw new Error('Failed')
      const c = await res.json()
      setComments(prev => [...prev, c])
      setValue('')
    } catch (e) { console.error(e); alert('Failed to post comment') }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Comments</div>
      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {!loading && comments.map(c => (
        <div key={c.id} className="p-3 bg-gray-50 rounded">
          <div className="text-sm font-semibold">{c.authorName || 'Anonymous'}</div>
          <div className="text-sm text-gray-700">{c.content}</div>
          <div className="text-xs text-gray-500">{c.createdAt}</div>
        </div>
      ))}

      <div className="flex gap-2">
        <input value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 border rounded px-2 py-1" placeholder="Write a comment..." />
        <button onClick={handlePost} className="px-3 py-1 bg-blue-600 text-white rounded">Post</button>
      </div>
    </div>
  )
}
