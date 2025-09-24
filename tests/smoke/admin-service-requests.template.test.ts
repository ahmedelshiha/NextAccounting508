import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Admin Service Requests uses ListPage with filters', () => {
  it('src/app/admin/service-requests/page.tsx references ListPage and filterConfigs', () => {
    const p = resolve(__dirname, '../../src/app/admin/service-requests/page.tsx')
    const src = readFileSync(p, 'utf8')
    expect(src.includes("ListPage")).toBe(true)
    expect(src.includes("filterConfigs")).toBe(true)
  })
})
