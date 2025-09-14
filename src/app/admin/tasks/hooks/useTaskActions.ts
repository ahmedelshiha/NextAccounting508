import { apiFetch } from '@/lib/api'

import { apiFetch } from '@/lib/api'

export const useTaskActions = () => {
  const create = async (input: any) => {
    const res = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    return res.ok ? await res.json() : Promise.reject(res)
  }
  const update = async (id: string, updates: any) => {
    const res = await apiFetch(`/api/admin/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    return res.ok ? await res.json() : Promise.reject(res)
  }
  const remove = async (id: string) => {
    const res = await apiFetch(`/api/admin/tasks/${id}`, { method: 'DELETE' })
    return res.ok
  }
  const assign = async (id: string, assigneeId: string | null) => {
    const res = await apiFetch(`/api/admin/tasks/${id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assigneeId }) })
    return res.ok ? await res.json() : Promise.reject(res)
  }
  const setStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/admin/tasks/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    return res.ok ? await res.json() : Promise.reject(res)
  }

  return { create, update, remove, assign, setStatus }
}
