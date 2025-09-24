import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Admin Services uses ListPage + AdvancedDataTable', () => {
  it('src/app/admin/services/page.tsx references ListPage and useAdvancedTable', () => {
    const p = resolve(__dirname, '../../src/app/admin/services/page.tsx')
    const src = readFileSync(p, 'utf8')
    expect(src.includes("ListPage")).toBe(true)
    expect(src.includes("useAdvancedTable")).toBe(true)
  })
})
