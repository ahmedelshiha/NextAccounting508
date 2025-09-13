import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

function renderWithHook(role: string) {
  vi.resetModules()
  vi.doMock('next-auth/react', () => ({ useSession: () => ({ data: { user: { role } } }) }))
  // dynamic import after mocking
  return import('../hooks/useTaskPermissions')
}

describe('useTaskPermissions', () => {
  it('grants full perms to ADMIN', async () => {
    const mod: any = await renderWithHook('ADMIN')
    const Comp: React.FC = () => { const p = mod.useTaskPermissions(); return <div data-create={String(p.canCreate)} data-delete={String(p.canDelete)} /> }
    const { container } = render(<Comp />)
    expect(container.querySelector('[data-create="true"]')).toBeTruthy()
    expect(container.querySelector('[data-delete="true"]')).toBeTruthy()
  })

  it('grants limited perms to STAFF', async () => {
    const mod: any = await renderWithHook('STAFF')
    const Comp: React.FC = () => { const p = mod.useTaskPermissions(); return <div data-create={String(p.canCreate)} data-bulk={String(p.canBulk)} /> }
    const { container } = render(<Comp />)
    expect(container.querySelector('[data-create="true"]')).toBeTruthy()
    expect(container.querySelector('[data-bulk="false"]')).toBeTruthy()
  })

  it('grants comment-only to USER', async () => {
    const mod: any = await renderWithHook('USER')
    const Comp: React.FC = () => { const p = mod.useTaskPermissions(); return <div data-comment={String(p.canComment)} data-edit={String(p.canEdit)} /> }
    const { container } = render(<Comp />)
    expect(container.querySelector('[data-comment="true"]')).toBeTruthy()
    expect(container.querySelector('[data-edit="false"]')).toBeTruthy()
  })
})
