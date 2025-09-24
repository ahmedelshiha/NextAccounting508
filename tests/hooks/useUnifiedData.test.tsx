import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test-mocks/testing-library-react'
import { useUnifiedData } from '@/hooks/useUnifiedData'

function Probe() {
  const { data, isLoading, error } = useUnifiedData<{ stamp: number }>({ key: '/api/admin/health-history', initialData: { stamp: 1 }, revalidateOnEvents: false })
  return <div>stamp:{String(data?.stamp ?? 'none')} loading:{isLoading ? '1' : '0'} error:{error ? '1' : '0'}</div>
}

describe('useUnifiedData', () => {
  it('returns initial data and loading false in SSR', () => {
    render(<Probe />)
    expect(screen.getByText('stamp:1 loading:0 error:0')).toBeTruthy()
  })
})
