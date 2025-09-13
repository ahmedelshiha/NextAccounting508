// stores/dashboardStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Types
interface DashboardStats {
  revenue: { 
    current: number
    previous: number 
    trend: number
    target: number
    targetProgress: number
  }
  bookings: { 
    total: number
    today: number
    thisWeek: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    conversion: number
  }
  clients: { 
    total: number
    new: number
    active: number
    inactive: number
    retention: number
    satisfaction: number
  }
  tasks: { 
    total: number
    overdue: number
    dueToday: number
    completed: number
    inProgress: number
    productivity: number
  }
}

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent'
  category: 'system' | 'booking' | 'client' | 'task' | 'revenue' | 'security'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionRequired: boolean
  actionUrl?: string
  priority: number
}

interface DashboardData {
  stats: DashboardStats
  notifications: Notification[]
  recentBookings: any[]
  urgentTasks: any[]
  systemHealth: any
}

// Store interface
interface DashboardStore {
  // State
  data: DashboardData | null
  loading: boolean
  error: string | null
  lastUpdated: Date
  autoRefresh: boolean
  selectedTimeframe: 'today' | 'week' | 'month'
  
  // Notifications
  showNotifications: boolean
  unreadCount: number
  
  // UI State
  expandedKPI: string | null
  activeActivityTab: 'schedule' | 'tasks' | 'deadlines'
  
  // Actions
  setData: (data: DashboardData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleAutoRefresh: () => void
  setTimeframe: (timeframe: 'today' | 'week' | 'month') => void
  
  // Notification actions
  toggleNotifications: () => void
  markAllAsRead: () => void
  markAsRead: (id: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  
  // UI actions
  setExpandedKPI: (id: string | null) => void
  setActiveActivityTab: (tab: 'schedule' | 'tasks' | 'deadlines') => void
  
  // Data refresh
  refreshData: () => Promise<void>
}

// Store implementation
export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    data: null,
    loading: false,
    error: null,
    lastUpdated: new Date(),
    autoRefresh: true,
    selectedTimeframe: 'month',
    
    showNotifications: false,
    unreadCount: 0,
    
    expandedKPI: null,
    activeActivityTab: 'schedule',
    
    // Actions
    setData: (data) => {
      const unreadCount = data.notifications.filter(n => !n.read).length
      set({ 
        data, 
        unreadCount,
        lastUpdated: new Date(), 
        error: null,
        loading: false
      })
    },
    
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),
    toggleAutoRefresh: () => set({ autoRefresh: !get().autoRefresh }),
    setTimeframe: (selectedTimeframe) => set({ selectedTimeframe }),
    
    // Notification actions
    toggleNotifications: () => set({ showNotifications: !get().showNotifications }),
    
    markAllAsRead: () => {
      const { data } = get()
      if (!data) return
      
      const updatedData = {
        ...data,
        notifications: data.notifications.map(n => ({ ...n, read: true }))
      }
      set({ data: updatedData, unreadCount: 0 })
    },
    
    markAsRead: (id) => {
      const { data } = get()
      if (!data) return
      
      const updatedData = {
        ...data,
        notifications: data.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      }
      const unreadCount = updatedData.notifications.filter(n => !n.read).length
      set({ data: updatedData, unreadCount })
    },
    
    addNotification: (notification) => {
      const { data } = get()
      if (!data) return
      
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      }
      
      const updatedData = {
        ...data,
        notifications: [newNotification, ...data.notifications].slice(0, 50)
      }
      const unreadCount = updatedData.notifications.filter(n => !n.read).length
      set({ data: updatedData, unreadCount })
    },
    
    // UI actions
    setExpandedKPI: (expandedKPI) => set({ expandedKPI }),
    setActiveActivityTab: (activeActivityTab) => set({ activeActivityTab }),
    
    // Data refresh
    refreshData: async () => {
      const { setLoading, setError, setData } = get()
      setLoading(true)
      
      try {
        // This would be replaced with actual API calls
        const response = await fetch('/api/admin/dashboard')
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        const data = await response.json()
        setData(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load data')
      }
    }
  }))
)

// Selectors for derived state
export const useKPIMetrics = () => useDashboardStore(state => state.data?.stats)
export const useNotifications = () => useDashboardStore(state => ({
  notifications: state.data?.notifications || [],
  unreadCount: state.unreadCount,
  showNotifications: state.showNotifications
}))
export const useSystemHealth = () => useDashboardStore(state => state.data?.systemHealth)
export const useRecentActivity = () => useDashboardStore(state => ({
  bookings: state.data?.recentBookings || [],
  tasks: state.data?.urgentTasks || []
}))

// Performance selectors (prevent unnecessary re-renders)
export const useDashboardLoading = () => useDashboardStore(state => state.loading)
export const useDashboardError = () => useDashboardStore(state => state.error)
export const useAutoRefresh = () => useDashboardStore(state => state.autoRefresh)