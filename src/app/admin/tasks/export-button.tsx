'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function ExportButton({ q }: { q?: string }) {
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      params.set('format', 'csv')
      const res = await fetch(`/api/admin/tasks/export?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tasks_export_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('export failed', e)
      alert('Export failed')
    }
  }

  return <Button size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
}
