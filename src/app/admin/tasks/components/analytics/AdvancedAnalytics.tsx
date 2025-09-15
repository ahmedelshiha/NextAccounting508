'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  Gauge,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
)

function titleCase(input: string): string {
  return input?.toString()?.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
}

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0 }

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { usePointStyle: true, padding: 16 }
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8,
      padding: 12
    }
  }
}

const barChartOptions = {
  ...baseChartOptions,
  plugins: { ...baseChartOptions.plugins, legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } }
  }
}

export default function AdvancedAnalytics() {
  const { loading, error, stats, refresh } = useTaskAnalytics()

  const byStatus = Array.isArray(stats?.byStatus) ? stats.byStatus : []
  const byPriority = Array.isArray(stats?.byPriority) ? stats.byPriority : []
  const total = Number(stats?.total || 0)
  const completed = Number(stats?.completed || 0)
  const avgAgeDays = Number(stats?.avgAgeDays || 0)
  const compliance = stats?.compliance || {}

  const inProgress = useMemo(() => {
    const row = byStatus.find((s: any) => String(s.status).toUpperCase() === 'IN_PROGRESS')
    return Number(row?._count?._all || 0)
  }, [byStatus])

  const criticalTasks = useMemo(() => {
    const row = byPriority.find((p: any) => String(p.priority).toUpperCase() === 'CRITICAL')
    return Number(row?._count?._all || 0)
  }, [byPriority])

  const completionRate = pct(completed, total)
  const complianceRate = Number(compliance?.complianceRate || 0)
  const overdueCompliance = Number(compliance?.overdueCompliance || 0)
  const complianceTotal = Number(compliance?.complianceTotal || 0)
  const complianceCompleted = Number(compliance?.complianceCompleted || 0)
  const avgTimeToCompliance = Number(compliance?.avgTimeToCompliance || 0)

  const statusChartData = useMemo(() => ({
    labels: byStatus.map((s: any) => titleCase(s.status)),
    datasets: [{
      label: 'Tasks',
      data: byStatus.map((s: any) => s?._count?._all ?? 0),
      backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6'],
      borderWidth: 0,
      hoverBorderWidth: 2,
      hoverBorderColor: '#ffffff'
    }]
  }), [byStatus])

  const priorityChartData = useMemo(() => ({
    labels: byPriority.map((p: any) => titleCase(p.priority)),
    datasets: [{
      label: 'Tasks',
      data: byPriority.map((p: any) => p?._count?._all ?? 0),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      borderRadius: 8,
      borderSkipped: false
    }]
  }), [byPriority])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border rounded p-3">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-0 shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Advanced Analytics
        </CardTitle>
        <button onClick={refresh} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-gray-600 flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Loading analytics...</div>
        )}

        <Tabs defaultValue="overview" className="w-full mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{total}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completed</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{completed}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{inProgress}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Avg Cycle Time</span>
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{avgAgeDays}d</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4 text-blue-600" />Tasks by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {byStatus.length > 0 ? (
                    <div className="h-64">
                      <Doughnut data={statusChartData} options={baseChartOptions as any} />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">No status data</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-600" />Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  {byPriority.length > 0 ? (
                    <div className="h-64">
                      <Bar data={priorityChartData} options={barChartOptions as any} />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">No priority data</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-xl border bg-green-50">
                    <div className="flex items-center gap-2 text-green-700 mb-1"><CheckCircle2 className="h-4 w-4" />Completed</div>
                    <div className="text-xl font-semibold text-green-700">{completed}</div>
                  </div>
                  <div className="p-4 rounded-xl border bg-blue-50">
                    <div className="flex items-center gap-2 text-blue-700 mb-1"><Activity className="h-4 w-4" />Active</div>
                    <div className="text-xl font-semibold text-blue-700">{inProgress}</div>
                  </div>
                  <div className="p-4 rounded-xl border bg-amber-50">
                    <div className="flex items-center gap-2 text-amber-700 mb-1"><AlertTriangle className="h-4 w-4" />Critical</div>
                    <div className="text-xl font-semibold text-amber-700">{criticalTasks}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-1"><Gauge className="h-4 w-4" />Productivity Score</div>
                  <div className="text-2xl font-bold text-blue-700">{Math.min(100, Math.round(completionRate + (complianceRate / 2)))}%</div>
                </CardContent>
              </Card>
              <Card className="border bg-gradient-to-r from-purple-50 to-violet-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-700 mb-1"><Clock className="h-4 w-4" />Avg Cycle Time</div>
                  <div className="text-2xl font-bold text-purple-700">{avgAgeDays}d</div>
                </CardContent>
              </Card>
              <Card className="border bg-gradient-to-r from-emerald-50 to-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1"><TrendingUp className="h-4 w-4" />Completion</div>
                  <div className="text-2xl font-bold text-emerald-700">{completionRate}%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Compliance Required</span>
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{complianceTotal}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Compliance Completed</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{complianceCompleted}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Overdue Items</span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold">{overdueCompliance}</div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-2xl border bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg Time To Compliance</span>
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{avgTimeToCompliance}d</div>
              </motion.div>
            </div>

            <Card className="border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Compliance</span>
                  <span className="font-medium">{complianceRate}%</span>
                </div>
                <Progress value={complianceRate} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">{overdueCompliance} overdue items need attention.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="flex items-center gap-2 text-green-700"><DollarSign className="h-4 w-4" /><span>Revenue analytics are not available with the current schema.</span></div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
