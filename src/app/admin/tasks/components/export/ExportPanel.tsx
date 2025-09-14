import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ExportPanel() {
  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/tasks/export?format=csv')
      if (!res.ok) throw new Error('Export failed')
      // download blob
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tasks-export.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to export')
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-600">Export tasks</div>
        <div className="mt-3">
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
      </CardContent>
    </Card>
  )
}
