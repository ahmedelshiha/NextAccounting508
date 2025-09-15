import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DollarSign, Activity, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTaskAnalytics } from '../../hooks/useTaskAnalytics'

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 1000) / 10 : 0 }

export default function AdvancedAnalytics() {
  const { loading, error, stats } = useTaskAnalytics()

  const total = Number(stats?.total || 0)
  const completed = Number(stats?.completed || 0)
  const byStatus = Array.isArray(stats?.byStatus) ? stats?.byStatus : []
  const byPriority = Array.isArray(stats?.byPriority) ? stats?.byPriority : []

  const inProgress = useMemo(() => {
    const row = byStatus.find((s: any) => String(s.status).toUpperCase() === 'IN_PROGRESS')
    return Number(row?._count?._all || 0)
  }, [byStatus])

  const completionRate = pct(completed, total)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-gray-600">Loading analytics...</div>}
        {error && <div className="text-sm text-red-700 bg-red-50 border rounded p-2">{error}</div>}
        {!loading && !error && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Tasks</div>
                    <div className="text-2xl font-bold">{total}</div>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold">{completed}</div>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">In Progress</div>
                    <div className="text-2xl font-bold">{inProgress}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded bg-green-50">
                  <div className="flex items-center gap-2 text-green-700 mb-2"><CheckCircle2 className="h-4 w-4" /><span>Completed</span></div>
                  <div className="text-2xl font-bold text-green-700">{completed}</div>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex items-center gap-2 text-blue-700 mb-2"><Activity className="h-4 w-4" /><span>Active</span></div>
                  <div className="text-2xl font-bold text-blue-700">{inProgress}</div>
                </div>
                <div className="p-4 border rounded bg-yellow-50">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2"><AlertTriangle className="h-4 w-4" /><span>Priorities</span></div>
                  <div className="text-sm text-gray-700">{byPriority.map((p: any) => `${p.priority}:${p?._count?._all ?? 0}`).join('  ')}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-2">
              <div className="text-sm text-gray-600">Compliance metrics not available in current schema. This section will populate once backend supports compliance fields.</div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-2">
              <div className="flex items-center gap-2 text-green-700"><DollarSign className="h-4 w-4" /><span>Revenue analytics not available in current schema.</span></div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
