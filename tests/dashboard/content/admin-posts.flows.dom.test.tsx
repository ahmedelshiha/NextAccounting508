import React from 'react'
import { act } from 'react-dom/test-utils'
import { renderDOM, fire } from '../../../test-mocks/dom'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn()
}))

import { apiFetch } from '@/lib/api'
import AdminPostsPage from '@/app/admin/posts/page'

function mockJson(data: any) { return { ok: true, json: async () => data } }

describe('Admin Posts CRUD flows', () => {
  beforeEach(() => { (apiFetch as unknown as vi.Mock).mockReset() })

  it('creates a new post via modal', async () => {
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [] })) // initial load
      .mockResolvedValueOnce(mockJson({})) // POST /api/posts
      .mockResolvedValueOnce(mockJson({ posts: [{ id: '1', title: 'My Post', slug: 'my-post', content: 'hello world content with enough length to pass validation '.repeat(5), excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }] })) // reload

    const { container, unmount, getByText } = renderDOM(<AdminPostsPage />)
    try {
      // open create modal
      const createBtn = getByText('Create Post')
      await act(async () => { fire.click(createBtn) })

      // fill form
      const title = container.querySelector('input[placeholder="Enter post title..."]') as HTMLInputElement
      const slug = container.querySelector('input[placeholder="post-url-slug"]') as HTMLInputElement
      const content = Array.from(container.querySelectorAll('textarea')).find(t => (t as HTMLTextAreaElement).placeholder?.includes('Write your professional blog content')) as HTMLTextAreaElement
      expect(title && slug && content).toBeTruthy()

      await act(async () => {
        fire.change(title, 'My Post')
        fire.change(slug, 'my-post')
        fire.change(content, 'hello world content with enough length to pass validation '.repeat(5))
      })

      const confirmCreate = Array.from(container.querySelectorAll('button')).find(b => (b.textContent || '').includes('Create Post')) as HTMLButtonElement
      await act(async () => { confirmCreate.click() })

      // assertions
      const calls = (apiFetch as any).mock.calls.map((c: any[]) => c[0])
      expect(calls[0]).toContain('/api/posts') // initial GET
      expect(calls.some((u: string) => u === '/api/posts')).toBeTruthy() // POST uses same path, but with method; ensure at least two calls
      expect(calls.filter((u: string) => u === '/api/posts').length).toBeGreaterThan(1)
    } finally { unmount() }
  })

  it('edits an existing post', async () => {
    const existing = { id: '1', title: 'Original', slug: 'original', content: 'original content content content content content', excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [existing] })) // initial load
      .mockResolvedValueOnce(mockJson({})) // PUT
      .mockResolvedValueOnce(mockJson({ posts: [{ ...existing, title: 'Updated' }] })) // reload

    const { container, unmount, getByText } = renderDOM(<AdminPostsPage />)
    try {
      const editBtn = getByText('Edit')
      await act(async () => { fire.click(editBtn) })

      const title = Array.from(container.querySelectorAll('input')).find(i => (i as HTMLInputElement).value === 'Original') as HTMLInputElement
      expect(title).toBeTruthy()
      await act(async () => { fire.change(title, 'Updated') })

      const update = Array.from(container.querySelectorAll('button')).find(b => (b.textContent || '').includes('Update Post')) as HTMLButtonElement
      await act(async () => { update.click() })

      const calls = (apiFetch as any).mock.calls
      const putCall = calls.find(([, init]: any[]) => init && init.method === 'PUT')
      expect(putCall && putCall[0]).toContain('/api/posts/original')
    } finally { unmount() }
  })

  it('deletes an existing post', async () => {
    const existing = { id: '1', title: 'To Delete', slug: 'to-delete', content: 'content '.repeat(50), excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [existing] })) // initial
      .mockResolvedValueOnce(mockJson({})) // DELETE
      .mockResolvedValueOnce(mockJson({ posts: [] })) // reload

    const { container, unmount, getByText } = renderDOM(<AdminPostsPage />)
    try {
      // find Delete icon button next to Edit
      const editBtnEl = getByText('Edit')
      const btn = editBtnEl.closest('button') as HTMLButtonElement
      const group = btn?.parentElement as HTMLElement
      const deleteBtn = group?.querySelectorAll('button')[1] as HTMLButtonElement
      expect(deleteBtn).toBeTruthy()

      await act(async () => { deleteBtn.click() })

      const confirmDelete = Array.from(container.querySelectorAll('button')).find(b => (b.textContent || '').includes('Delete Post')) as HTMLButtonElement
      await act(async () => { confirmDelete.click() })

      const calls = (apiFetch as any).mock.calls
      const delCall = calls.find(([, init]: any[]) => init && init.method === 'DELETE')
      expect(delCall && delCall[0]).toContain('/api/posts/to-delete')
    } finally { unmount() }
  })
})
