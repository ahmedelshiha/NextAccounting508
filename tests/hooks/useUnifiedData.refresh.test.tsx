import { render, screen } from '../../test-mocks/testing-library-react'
import { useUnifiedData } from '@/hooks/useUnifiedData'

function Probe() {
  const { refresh, key } = useUnifiedData<{ n: number }>({ key: 'health-history', initialData: { n: 1 }, revalidateOnEvents: false })
  // Assert presence of refresh as a function by rendering its typeof
  return <div>key:{key} refreshType:{typeof refresh}</div>
}

describe('useUnifiedData refresh', () => {
  it('exposes a refresh function in SSR', () => {
    render(<Probe />)
    const el = screen.getByText('refreshType:function')
    expect(el).toBeTruthy()
  })
})
