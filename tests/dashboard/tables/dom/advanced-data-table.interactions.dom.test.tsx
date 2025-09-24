import React from 'react'
import { describe, it, expect } from 'vitest'
import { act } from 'react-dom/test-utils'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import { TranslationContext } from '@/lib/i18n'
import { renderDOM, fire } from '../../../../test-mocks/dom'

interface Row { id: number; name: string }

function withI18n(children: React.ReactElement) {
  return (
    <TranslationContext.Provider value={{ locale: 'en', translations: { 'dashboard.selectedCount': '{{count}} selected', 'dashboard.actions': 'Actions', 'dashboard.noData': 'No records found' }, setLocale: () => {} }}>
      {children}
    </TranslationContext.Provider>
  )
}

describe('AdvancedDataTable interactions', () => {
  it('select all toggles selection count and calls onSelectionChange', async () => {
    const rows: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const changes: Array<Array<number>> = []

    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        selectable
        onSelectionChange={(ids) => changes.push(ids as number[])}
      />
    )

    const { container, unmount } = renderDOM(ui)
    try {
      const master = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement
      expect(master).toBeTruthy()

      await act(async () => { master.click() })

      const summary = Array.from(container.querySelectorAll('div')).find(d => /selected/i.test(d.textContent || ''))
      expect(summary && (summary.textContent || '')).toContain('3 selected')
      expect(changes.length).toBeGreaterThan(0)
      expect(changes[changes.length - 1].length).toBe(3)
    } finally {
      unmount()
    }
  })

  it('paginates with Next/Previous buttons', async () => {
    const rows: Row[] = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: `R${i + 1}` }))
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        pageSize={2}
      />
    )

    const { container, getByText, unmount } = renderDOM(ui)
    try {
      expect(getByText(/Page 1 of 3/i)).toBeTruthy()
      const next = Array.from(container.querySelectorAll('button')).find(b => /next/i.test(b.textContent || '')) as HTMLButtonElement
      await act(async () => { next.click() })
      expect(getByText(/Page 2 of 3/i)).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('emits onSort when sortable column header clicked', async () => {
    const rows: Row[] = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
    const calls: string[] = []
    const ui = withI18n(
      <AdvancedDataTable<Row>
        columns={[{ key: 'name', label: 'Name', sortable: true }]}
        rows={rows}
        onSort={(k) => { calls.push(k) }}
      />
    )

    const { container, unmount } = renderDOM(ui)
    try {
      const btn = Array.from(container.querySelectorAll('th button')).find(Boolean) as HTMLButtonElement
      await act(async () => { btn.click() })
      expect(calls).toEqual(['name'])
    } finally {
      unmount()
    }
  })
})
