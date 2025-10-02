export async function runDiagnostics() {
  const res = await fetch('/api/admin/settings/diagnostics', { method: 'POST' })
  if (!res.ok) throw new Error('Diagnostics failed')
  return res.json()
}

export async function exportSettings() {
  const res = await fetch('/api/admin/settings/export')
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  return blob
}

export async function importSettings(payload: any) {
  const res = await fetch('/api/admin/settings/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Import failed')
  }
  return res.json()
}
