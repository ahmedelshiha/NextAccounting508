import { describe, it, expect } from 'vitest'
import { renderDOM } from '../../../../test-mocks/dom'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'

interface Row { id: number; name: string }

function withI18n(children: React.ReactElement) {
  return (
    <TranslationContext.Provider value={{ locale: 'en', translations: { 'dashboard.selectedCount': '{{count}} selected', 'dashboard.actions': 'Actions', 'dashboard.noData': 'No records found' }, setLocale: () => {} }}>
      {children}
    </TranslationContext.Provider>
  )
}

describe('AdvancedDataTable a11y focusability', () => {
  it('header sort button and pagination buttons are focusable', () => {
    const rows: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name', sortable: true }]}
        rows={rows}
        pageSize={2}
      />
    )
    const { container, unmount } = renderDOM(ui)
    try {
      const sortBtn = container.querySelector('th button') as HTMLButtonElement
      const prev = container.querySelector('button[aria-label="Previous page"]') as HTMLButtonElement
      const next = container.querySelector('button[aria-label="Next page"]') as HTMLButtonElement
      expect(sortBtn).toBeTruthy()
      expect(prev).toBeTruthy()
      expect(next).toBeTruthy()
      expect(sortBtn.tabIndex).not.toBe(-1)
      expect(prev.tabIndex).not.toBe(-1)
      expect(next.tabIndex).not.toBe(-1)
    } finally {
      unmount()
    }
  })
})
