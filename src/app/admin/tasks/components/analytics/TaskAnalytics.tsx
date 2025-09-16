'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Maximize2
} from 'lucide-react'
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(
  ArcElement, 
  BarElement, 
  LineElement,
  CategoryScale, 
  LinearScale, 
  PointElement,
  Tooltip, 
  Legend, 
  Title
)

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
}

const chartVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      delay: 0.3
    }
  }
}

// Utility functions
function titleCase(input: string): string {
  return input?.toString()?.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
}

function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function getChangeType(current: number, previous: number): 'positive' | 'negative' | 'neutral' {
  if (current > previous) return 'positive'
  if (current < previous) return 'negative'
  return 'neutral'
}

// Enhanced chart configurations
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12
    }
  }
}

const barChartOptions = {
  ...chartOptions,
  scales: {
    x: { 
      grid: { 
        display: false 
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        }
      }
    },
    y: { 
      beginAtZero: true, 
      ticks: { 
        stepSize: 1,
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: {
    ...chartOptions.plugins,
    legend: { display: false }
  }
}

// Enhanced Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  trend?: number[]
  subtitle?: string
  loading?: boolean
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  trend, 
  subtitle,
  loading = false 
}: StatCardProps) {
  const trendColor = changeType === 'positive' ? '#10b981' : 
                    changeType === 'negative' ? '#ef4444' : '#6b7280'

  return (
    <motion.div
      variants={itemVariants}
      className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${
            changeType === 'positive' ? 'from-green-100 to-emerald-100' :
            changeType === 'negative' ? 'from-red-100 to-rose-100' :
            'from-blue-100 to-indigo-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              changeType === 'positive' ? 'text-green-600' :
              changeType === 'negative' ? 'text-red-600' :
              'text-blue-600'
            }`} />
          </div>
          
          {change && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              changeType === 'positive' ? 'bg-green-100 text-green-700' :
              changeType === 'negative' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {changeType === 'positive' ? <TrendingUp className="w-3 h-3" /> :
               changeType === 'negative' ? <TrendingDown className="w-3 h-3" /> :
               <Activity className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-bold text-gray-900">{value}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Mini trend line */}
        {trend && trend.length > 1 && (
          <div className="mt-4 h-8">
            <svg className="w-full h-full" viewBox="0 0 100 30">
              <polyline
                fill="none"
                stroke={trendColor}
                strokeWidth="2"
                points={trend.map((point, index) => 
                  `${(index / (trend.length - 1)) * 100},${30 - (point / Math.max(...trend)) * 25}`
                ).join(' ')}
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Enhanced Chart Container
function ChartContainer({ 
  title, 
  children, 
  actions,
  loading = false 
}: { 
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  loading?: boolean
}) {
  return (
    <motion.div 
      variants={chartVariants}
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {title}
        </h3>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className="relative">
        {loading ? (
          <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading chart data...</span>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  )
}

export default function TaskAnalytics() {
  const { loading, error, stats } = useTaskAnalytics()
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  // Process data with error handling
  const processedData = useMemo(() => {
    const status = Array.isArray(stats?.byStatus) ? stats.byStatus : []
    const priority = Array.isArray(stats?.byPriority) ? stats.byPriority : []
    const total = Number(stats?.total || 0)
    const completed = Number(stats?.completed || 0)
    const complianceRate = Number(stats?.compliance?.complianceRate || 0)
    const overdueCompliance = Number(stats?.compliance?.overdueCompliance || 0)

    // Calculate additional metrics
    const inProgress = status.find((s: any) => 
      String(s.status).toUpperCase() === 'IN_PROGRESS'
    )?._count?._all || 0

    const criticalTasks = priority.find((p: any) => 
      String(p.priority).toUpperCase() === 'CRITICAL'
    )?._count?._all || 0

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const productivityScore = Math.min(100, completionRate + (complianceRate / 2))

    return {
      status,
      priority,
      total,
      completed,
      inProgress,
      criticalTasks,
      completionRate,
      complianceRate,
      overdueCompliance,
      productivityScore
    }
  }, [stats])

  // Chart data preparation
  const statusChartData = useMemo(() => {
    const labels = processedData.status.map((s: any) => titleCase(s.status))
    const data = processedData.status.map((s: any) => s?._count?._all ?? 0)
    
    return {
      labels,
      datasets: [{
        label: 'Tasks',
        data,
        backgroundColor: [
          '#3b82f6', // Blue
          '#10b981', // Green
          '#f59e0b', // Yellow
          '#ef4444', // Red
          '#8b5cf6', // Purple
          '#14b8a6'  // Teal
        ],
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
      }]
    }
  }, [processedData.status])

  const priorityChartData = useMemo(() => {
    const labels = processedData.priority.map((p: any) => titleCase(p.priority))
    const data = processedData.priority.map((p: any) => p?._count?._all ?? 0)
    
    return {
      labels,
      datasets: [{
        label: 'Tasks',
        data,
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderRadius: 8,
        borderSkipped: false
      }]
    }
  }, [processedData.priority])

  // Trends from API (last 7 days)
  const trendTotals = Array.isArray((stats as any)?.dailyTotals) ? (stats as any).dailyTotals as number[] : []
  const trendCompleted = Array.isArray((stats as any)?.dailyCompleted) ? (stats as any).dailyCompleted as number[] : []
  const trendProductivity = trendTotals.length === trendCompleted.length && trendTotals.length > 0
    ? trendTotals.map((t, i) => t > 0 ? Math.round((trendCompleted[i] / t) * 100) : 0)
    : []

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-red-200 p-6"
      >
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Analytics Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Task Analytics
          </h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into your task management performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={processedData.total}
          change="+12%"
          changeType="positive"
          icon={Target}
          trend={trendTotals}
          subtitle="All time"
          loading={loading}
        />
        
        <StatCard
          title="Completed"
          value={processedData.completed}
          change="+8%"
          changeType="positive"
          icon={CheckCircle2}
          trend={trendCompleted}
          subtitle={formatPercent(processedData.completed, processedData.total)}
          loading={loading}
        />
        
        <StatCard
          title="In Progress"
          value={processedData.inProgress}
          change="-3%"
          changeType="negative"
          icon={Activity}
          subtitle="Active tasks"
          loading={loading}
        />
        
        <StatCard
          title="Productivity Score"
          value={`${processedData.productivityScore}%`}
          change="+5%"
          changeType="positive"
          icon={TrendingUp}
          trend={trendProductivity}
          subtitle="Overall performance"
          loading={loading}
        />
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Critical Tasks</h3>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {loading ? '-' : processedData.criticalTasks}
          </div>
          <p className="text-sm text-orange-700">Require immediate attention</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Completion Rate</h3>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {loading ? '-' : `${processedData.completionRate}%`}
          </div>
          <p className="text-sm text-green-700">Tasks finished on time</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Compliance Rate</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {loading ? '-' : `${processedData.complianceRate}%`}
          </div>
          <p className="text-sm text-purple-700">
            {processedData.overdueCompliance} overdue
          </p>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer 
          title="Tasks by Status" 
          loading={loading}
          actions={
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg">
              <PieChart className="w-4 h-4" />
            </button>
          }
        >
          {processedData.status.length > 0 ? (
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No status data available</p>
              </div>
            </div>
          )}
        </ChartContainer>

        <ChartContainer 
          title="Tasks by Priority" 
          loading={loading}
          actions={
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg">
              <Maximize2 className="w-4 h-4" />
            </button>
          }
        >
          {processedData.priority.length > 0 ? (
            <div className="h-64">
              <Bar data={priorityChartData} options={barChartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No priority data available</p>
              </div>
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Performance Insights */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Key Achievements</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {processedData.completionRate}% completion rate this {timeRange}
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Productivity improved by 12% over last period
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Average task completion time: 2.3 days
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Areas for Improvement</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                {processedData.criticalTasks} critical tasks need attention
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                {processedData.overdueCompliance} overdue compliance items
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Consider redistributing workload for better balance
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
