import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test-mocks/testing-library-react'
import { RealtimeProvider, useAdminRealtime } from '@/components/dashboard/realtime/RealtimeProvider'

function Probe() {
  const { connected, lastEvent } = useAdminRealtime()
  return <div>connected:{connected ? '1' : '0'} last:{lastEvent ? '1' : '0'}</div>
}

describe('RealtimeProvider', () => {
  it('renders provider without runtime errors in SSR and exposes defaults', () => {
    render(
      <RealtimeProvider events={['all']}>
        <Probe />
      </RealtimeProvider>
    )
    expect(screen.getByText('connected:0 last:0')).toBeTruthy()
  })
})
