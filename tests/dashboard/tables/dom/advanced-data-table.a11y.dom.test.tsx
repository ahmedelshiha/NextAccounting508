import { describe, it, expect } from 'vitest'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

interface Row { id: number; name: string }

function withI18n(children: React.ReactElement) {
  return (
    <TranslationContext.Provider value={{ locale: 'en', translations: { 'dashboard.selectedCount': '{{count}} selected', 'dashboard.actions': 'Actions', 'dashboard.noData': 'No records found' }, setLocale: () => {} }}>
      {children}
    </TranslationContext.Provider>
  )
}

describe('AdvancedDataTable a11y', () => {
  it('renders pagination as a navigation landmark with labeled controls', async () => {
    const rows: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        pageSize={2}
      />
    )

    const { container, unmount } = render(ui)
    try {
      // pagination summary visible
      expect(screen.getByText(/Page 1 of 2/i)).toBeTruthy()
      // navigation landmark present
      const nav = container.querySelector('div[role="navigation"][aria-label="Pagination"]') as HTMLElement
      expect(nav).toBeTruthy()
      // labeled buttons exist
      const prev = nav.querySelector('button[aria-label="Previous page"]') as HTMLButtonElement
      const next = nav.querySelector('button[aria-label="Next page"]') as HTMLButtonElement
      expect(prev && next).toBeTruthy()

      // buttons operate via click (keyboard activation triggers click in browsers)
      fireEvent.click(next)
      await waitFor(() => expect(getByText(/Page 2 of 2/i)).toBeTruthy())
    } finally {
      unmount()
    }
  })
})
