import type { OrganizationSettings } from '@/schemas/settings/organization'

export type OrgSettingsPatch = Partial<OrganizationSettings>

async function http<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    let message = 'Request failed'
    try { message = (await res.json()).error || message } catch {}
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export async function getOrgSettings(): Promise<OrganizationSettings> {
  return http<OrganizationSettings>('/api/admin/org-settings')
}

export async function updateOrgSettings(patch: OrgSettingsPatch): Promise<void> {
  await http('/api/admin/org-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export async function exportOrgSettings(): Promise<Blob> {
  const res = await fetch('/api/admin/org-settings/export')
  if (!res.ok) throw new Error('Export failed')
  return res.blob()
}

export async function importOrgSettings(payload: any): Promise<void> {
  const res = await fetch('/api/admin/org-settings/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Import failed')
}
