export type FavoriteSettingItem = {
  id: string
  tenantId: string
  userId: string
  settingKey: string
  route: string
  label: string
  createdAt: string
}

function writeFavoritesCache(items: FavoriteSettingItem[]) {
  try {
    const map: Record<string, boolean> = {}
    for (const i of items) map[i.settingKey] = true
    sessionStorage.setItem('settings:favorites', JSON.stringify(map))
  } catch {}
}

export function readFavoritesCachedMap(): Record<string, boolean> | null {
  try {
    const raw = sessionStorage.getItem('settings:favorites')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, boolean> : null
  } catch {
    return null
  }
}

export async function getFavorites(): Promise<FavoriteSettingItem[]> {
  const res = await fetch('/api/admin/settings/favorites', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(()=>({}))
  const arr = Array.isArray(data?.data) ? data.data as FavoriteSettingItem[] : []
  try { writeFavoritesCache(arr); window.dispatchEvent(new Event('favorites:updated')) } catch {}
  return arr
}

export async function addFavorite(input: { settingKey: string; route: string; label: string }): Promise<FavoriteSettingItem | null> {
  const res = await fetch('/api/admin/settings/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return null
  const data = await res.json().catch(()=>({}))
  const created = (data?.data as FavoriteSettingItem) || null
  try {
    const map = readFavoritesCachedMap() || {}
    if (created) map[created.settingKey] = true
    sessionStorage.setItem('settings:favorites', JSON.stringify(map))
    window.dispatchEvent(new Event('favorites:updated'))
  } catch {}
  return created
}

export async function removeFavorite(settingKey: string): Promise<boolean> {
  const res = await fetch('/api/admin/settings/favorites?settingKey=' + encodeURIComponent(settingKey), { method: 'DELETE' })
  try {
    if (res.ok) {
      const map = readFavoritesCachedMap() || {}
      if (settingKey in map) delete map[settingKey]
      sessionStorage.setItem('settings:favorites', JSON.stringify(map))
      window.dispatchEvent(new Event('favorites:updated'))
    }
  } catch {}
  return res.ok
}
