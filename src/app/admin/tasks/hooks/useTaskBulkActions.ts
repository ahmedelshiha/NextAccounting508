export const useTaskBulkActions = () => {
  const bulk = async (action: string, taskIds: string[], updates?: any) => {
    const res = await apiFetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, taskIds, updates }) })
    return res.ok ? await res.json() : Promise.reject(res)
  }
  return { bulk }
}
