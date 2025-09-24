import { render, screen } from '../../test-mocks/testing-library-react'
import ListPage from '@/components/dashboard/templates/ListPage'

interface Row { id: number; name: string }

describe('ListPage', () => {
  it('renders table headers and rows in SSR', () => {
    const rows: Row[] = [
      { id: 1, name: 'R1' },
      { id: 2, name: 'R2' }
    ]

    render(
      <ListPage<Row>
        title="Services"
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        selectable={false}
        useAdvancedTable={true}
      />
    )

    expect(screen.getByText('Services')).toBeTruthy()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('R1')).toBeTruthy()
    expect(screen.getByText('R2')).toBeTruthy()
  })
})
