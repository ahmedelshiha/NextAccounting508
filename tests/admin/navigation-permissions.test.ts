import { describe, it, expect } from 'vitest'
import { getNavigation } from '@/lib/admin/navigation-registry'

describe('navigation permissions', () => {
  it('CLIENT should not see Analytics or Team', () => {
    const nav = getNavigation({ userRole: 'CLIENT', counts: null })
    const items = nav.flatMap(s => s.items)
    const labels = items.map(i => i.label)
    expect(labels).not.toContain('Analytics')
    expect(labels).not.toContain('Team')
  })

  it('TEAM_LEAD sees Analytics and Team', () => {
    const nav = getNavigation({ userRole: 'TEAM_LEAD', counts: null })
    const labels = nav.flatMap(s => s.items).map(i => i.label)
    expect(labels).toContain('Analytics')
    expect(labels).toContain('Team')
  })
})
