import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTranslationPriority() {
  const { data, error, mutate } = useSWR('/api/admin/translations/priority', fetcher)

  async function createOrUpdate(item: any) {
    const res = await fetch('/api/admin/translations/priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const j = await res.json()
    await mutate()
    return j
  }

  async function update(id: string, patch: any) {
    const res = await fetch(`/api/admin/translations/priority/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const j = await res.json()
    await mutate()
    return j
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/translations/priority/${id}`, { method: 'DELETE' })
    const j = await res.json()
    await mutate()
    return j
  }

  async function bulkUpsert(items: any[]) {
    const res = await fetch('/api/admin/translations/priority/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    const j = await res.json()
    await mutate()
    return j
  }

  return {
    priorities: data?.data || [],
    loading: !error && !data,
    error,
    createOrUpdate,
    update,
    remove,
    bulkUpsert,
    refresh: mutate,
  }
}
