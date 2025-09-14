import { apiFetch } from '@/lib/api'

export const useTaskAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/tasks/analytics')
      if (!res.ok) throw new Error('Failed to load analytics')
      const data = await res.json().catch(() => ({}))
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  return { loading, error, stats, refresh: fetchStats }
}
