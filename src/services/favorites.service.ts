export type FavoriteSettingItem = {
  id: string
  tenantId: string
  userId: string
  settingKey: string
  route: string
  label: string
  createdAt: string
}

export async function getFavorites(): Promise<FavoriteSettingItem[]> {
  const res = await fetch('/api/admin/settings/favorites', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(()=>({}))
  return Array.isArray(data?.data) ? data.data as FavoriteSettingItem[] : []
}

export async function addFavorite(input: { settingKey: string; route: string; label: string }): Promise<FavoriteSettingItem | null> {
  const res = await fetch('/api/admin/settings/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return null
  const data = await res.json().catch(()=>({}))
  return (data?.data as FavoriteSettingItem) || null
}

export async function removeFavorite(settingKey: string): Promise<boolean> {
  const res = await fetch('/api/admin/settings/favorites?settingKey=' + encodeURIComponent(settingKey), { method: 'DELETE' })
  return res.ok
}
