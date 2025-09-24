import { render, screen } from '../../test-mocks/testing-library-react'
import StandardPage from '@/components/dashboard/templates/StandardPage'

describe('StandardPage', () => {
  it('renders title and children in SSR', () => {
    render(
      <StandardPage title="Clients" subtitle="Manage client records">
        <div>Body content</div>
      </StandardPage>
    )
    expect(screen.getByText('Clients')).toBeTruthy()
    expect(screen.getByText('Body content')).toBeTruthy()
  })
})
