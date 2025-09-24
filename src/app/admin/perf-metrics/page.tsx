"use client"

import useSWR from 'swr'
import { Card } from '@/components/ui/card'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminPerfMetricsPage() {
  const { data, error, isLoading } = useSWR('/api/admin/perf-metrics', fetcher, { refreshInterval: 10000 })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Performance Metrics</h1>
      <p className="text-sm text-gray-600">Client-reported samples (LCP, CLS, INP, basic navigation timings) and snapshot aggregates. Auto-refreshes every 10s.</p>

      <Card className="p-4">
        {isLoading && <div className="text-gray-600">Loading metrics…</div>}
        {error && <div className="text-red-600">Failed to load metrics</div>}
        {data && (
          <div className="space-y-4">
            <div>
              <h2 className="font-medium text-gray-900">Snapshot</h2>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white rounded-lg border p-3">
                  <div className="text-gray-500">Page Load (s)</div>
                  <div className="text-gray-900 font-semibold">{data.pageLoad?.current}</div>
                  <div className="text-xs text-gray-500">Prev: {data.pageLoad?.previous} ({data.pageLoad?.trend})</div>
                </div>
                <div className="bg-white rounded-lg border p-3">
                  <div className="text-gray-500">API Resp (ms)</div>
                  <div className="text-gray-900 font-semibold">{data.apiResponse?.current}</div>
                  <div className="text-xs text-gray-500">Prev: {data.apiResponse?.previous} ({data.apiResponse?.trend})</div>
                </div>
                <div className="bg-white rounded-lg border p-3">
                  <div className="text-gray-500">Uptime (%)</div>
                  <div className="text-gray-900 font-semibold">{data.uptime?.current}</div>
                  <div className="text-xs text-gray-500">Prev: {data.uptime?.previous} ({data.uptime?.trend})</div>
                </div>
                <div className="bg-white rounded-lg border p-3">
                  <div className="text-gray-500">Error Rate (%)</div>
                  <div className="text-gray-900 font-semibold">{data.errorRate?.current}</div>
                  <div className="text-xs text-gray-500">Prev: {data.errorRate?.previous} ({data.errorRate?.trend})</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-medium text-gray-900">Recent Client Samples</h2>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500">When</th>
                      <th className="px-4 py-2 text-left text-gray-500">Path</th>
                      <th className="px-4 py-2 text-left text-gray-500">LCP</th>
                      <th className="px-4 py-2 text-left text-gray-500">CLS</th>
                      <th className="px-4 py-2 text-left text-gray-500">INP</th>
                      <th className="px-4 py-2 text-left text-gray-500">TTFB</th>
                      <th className="px-4 py-2 text-left text-gray-500">FCP</th>
                      <th className="px-4 py-2 text-left text-gray-500">DOM Interactive</th>
                      <th className="px-4 py-2 text-left text-gray-500">Load</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data.recent || []).slice().reverse().map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{new Date(s.ts).toLocaleTimeString()}</td>
                        <td className="px-4 py-2">{s.path}</td>
                        <td className="px-4 py-2">{s.metrics?.lcp ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.cls ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.inp ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.ttfb ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.fcp ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.domInteractive ?? '-'}</td>
                        <td className="px-4 py-2">{s.metrics?.load ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-medium text-gray-900">How to Compare Before/After</h2>
        <ol className="list-decimal ml-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>Open high-traffic routes (Bookings, Services) and navigate normally to generate samples.</li>
          <li>Use this page to monitor LCP, CLS, INP, and navigation timings.</li>
          <li>Record snapshots pre-/post-change in docs/perf-metrics-report.md.</li>
          <li>Look for LCP reductions and stable CLS; INP should remain acceptable (&lt;200ms typical).</li>
        </ol>
      </Card>
    </div>
  )
}
