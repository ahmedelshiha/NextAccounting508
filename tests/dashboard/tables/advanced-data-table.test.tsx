import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test-mocks/testing-library-react'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'

interface Row { id: number; name: string }

describe('AdvancedDataTable', () => {
  it('renders pagination summary in SSR', () => {
    const rows: Row[] = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: `R${i+1}` }))
    render(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        pageSize={2}
      />
    )
    expect(screen.getByText('Page 1 of 3')).toBeTruthy()
  })
})
