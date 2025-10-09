// @vitest-environment jsdom
import React, { useMemo } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SWRConfig } from 'swr'
import { RealtimeCtx } from '@/components/dashboard/realtime/RealtimeProvider'
import { useUnifiedData } from '@/hooks/useUnifiedData'

// A controllable realtime provider for testing
function makeMockRealtime() {
  const subscribers: Array<{ types: Set<string>; handler: (e: any) => void }> = []
  const value = {
    connected: true,
    lastEvent: null as any,
    subscribeByTypes: (types: string[], handler: (e: any) => void) => {
      const entry = { types: new Set(types && types.length ? types : ['all']), handler }
      subscribers.push(entry)
      return () => {
        const idx = subscribers.indexOf(entry)
        if (idx >= 0) subscribers.splice(idx, 1)
      }
    }
  }
  const trigger = (type: string, data: any = {}) => {
    const evt = { type, data, timestamp: new Date().toISOString() }
    for (const sub of subscribers) {
      if (sub.types.has('all') || sub.types.has(type)) sub.handler(evt as any)
    }
  }
  return { value, trigger }
}

function Probe() {
  const { data } = useUnifiedData<{ n: number }>({ key: 'health-history', initialData: { n: 0 }, events: ['tick'] })
  const n = data?.n ?? -1
  return <div id="out">n:{n}</div>
}

describe('useUnifiedData revalidates on realtime events', () => {
  it('updates data when an interested event is triggered', async () => {
    let current = 0
    const fetcher = async () => ({ n: current })
    const realtime = makeMockRealtime()

    const { container } = render(
      <SWRConfig value={{ fetcher, provider: () => new Map() }}>
        <RealtimeCtx.Provider value={realtime.value}>
          <Probe />
        </RealtimeCtx.Provider>
      </SWRConfig>
    )

    await waitFor(() => expect(container.textContent || '').toContain('n:0'))

    current = 1
    realtime.trigger('tick')

    await waitFor(() => expect(container.textContent || '').toContain('n:1'))
  })
})
