'use client'

import React, { useEffect, useState } from 'react'

export default function ExportPanel() {
  const [format, setFormat] = useState<'csv'|'xlsx'>('csv')
  const [templates, setTemplates] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateContent, setNewTemplateContent] = useState('')

  const fetchTemplates = async () => {
    try {
      const r = await fetch('/api/admin/tasks/templates')
      if (!r.ok) return
      const data = await r.json()
      setTemplates(data)
    } catch (e) { /* ignore */ }
  }
  const fetchNotifications = async () => {
    try {
      const r = await fetch('/api/admin/tasks/notifications')
      if (!r.ok) return
      const data = await r.json()
      setNotifications(data)
    } catch (e) { /* ignore */ }
  }

  useEffect(() => { fetchTemplates(); fetchNotifications() }, [])

  const handleExport = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/tasks/export?format=${format}`)
      if (!r.ok) throw new Error('Export failed')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tasks-export.${format === 'xlsx' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Export failed')
    } finally { setLoading(false) }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return
    try {
      const r = await fetch('/api/admin/tasks/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTemplateName, content: newTemplateContent }) })
      if (r.ok) {
        setNewTemplateName('')
        setNewTemplateContent('')
        fetchTemplates()
      } else {
        alert('Failed to create template')
      }
    } catch (e) { console.error(e); alert('Failed to create template') }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete template?')) return
    try {
      const r = await fetch(`/api/admin/tasks/templates?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (r.ok) fetchTemplates()
    } catch (e) { console.error(e) }
  }

  const handleSaveNotifications = async () => {
    try {
      const r = await fetch('/api/admin/tasks/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notifications) })
      if (r.ok) {
        const data = await r.json()
        setNotifications(data)
        alert('Saved')
      } else alert('Failed')
    } catch (e) { console.error(e); alert('Failed') }
  }

  return (
    <div className="bg-white border rounded p-4 space-y-4">
      <h3 className="text-lg font-semibold">Export & Templates</h3>

      <div>
        <label className="text-sm text-gray-600">Format</label>
        <select value={format} onChange={e => setFormat(e.target.value as any)} className="border rounded px-2 py-1 w-full mb-2">
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>
        <button onClick={handleExport} className="w-full px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Exporting...' : 'Export Tasks'}</button>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Templates</div>
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="p-2 border rounded flex items-start justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-[220px]">{t.content}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm text-blue-600" onClick={() => navigator.clipboard.writeText(t.content || '')}>Copy</button>
                <button className="text-sm text-red-600" onClick={() => handleDeleteTemplate(t.id)}>Delete</button>
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Template name" className="border rounded px-2 py-1 w-full" />
            <textarea value={newTemplateContent} onChange={e => setNewTemplateContent(e.target.value)} placeholder="Template content" className="border rounded px-2 py-1 w-full" />
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleCreateTemplate}>Add</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { setNewTemplateName(''); setNewTemplateContent('') }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Notifications</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!notifications?.emailEnabled} onChange={e => setNotifications((prev: any) => ({ ...prev, emailEnabled: e.target.checked }))} />
            <span className="text-sm">Enable email notifications</span>
          </label>
          <input value={notifications?.emailFrom || ''} onChange={e => setNotifications((prev: any) => ({ ...prev, emailFrom: e.target.value }))} placeholder="From address" className="border rounded px-2 py-1 w-full" />
          <input value={notifications?.webhookUrl || ''} onChange={e => setNotifications((prev: any) => ({ ...prev, webhookUrl: e.target.value }))} placeholder="Webhook URL" className="border rounded px-2 py-1 w-full" />
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSaveNotifications}>Save</button>
          </div>
        </div>
      </div>

    </div>
  )
}
