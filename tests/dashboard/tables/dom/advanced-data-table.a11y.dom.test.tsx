import { describe, it, expect } from 'vitest'
import { act } from 'react-dom/test-utils'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'
import { renderDOM } from '../../../../test-mocks/dom'

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

    const { container, getByText, unmount } = renderDOM(ui)
    try {
      // pagination summary visible
      expect(getByText(/Page 1 of 2/i)).toBeTruthy()
      // navigation landmark present
      const nav = container.querySelector('div[role="navigation"][aria-label="Pagination"]') as HTMLElement
      expect(nav).toBeTruthy()
      // labeled buttons exist
      const prev = nav.querySelector('button[aria-label="Previous page"]') as HTMLButtonElement
      const next = nav.querySelector('button[aria-label="Next page"]') as HTMLButtonElement
      expect(prev && next).toBeTruthy()

      // buttons operate via click (keyboard activation triggers click in browsers)
      await act(async () => { next.click() })
      expect(getByText(/Page 2 of 2/i)).toBeTruthy()
    } finally {
      unmount()
    }
  })
})
