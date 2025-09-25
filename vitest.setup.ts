import { vi } from 'vitest'
import * as React from 'react'
import fs from 'fs'

// Expose React globally for tests that perform SSR renders and rely on React being available
;(globalThis as any).React = React

// Expose fs helpers globally for tests that call readFileSync/writeFileSync without importing
;(globalThis as any).readFileSync = fs.readFileSync
;(globalThis as any).writeFileSync = fs.writeFileSync
;(globalThis as any).existsSync = fs.existsSync

// Default mocks to avoid Next.js headers() runtime issues in tests
const defaultSession = { user: { id: 'test-user', role: 'ADMIN', email: 'test@example.com', name: 'Test User' } }
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => defaultSession),
  // other exports if needed
}))
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => defaultSession),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: defaultSession, status: 'authenticated' }),
  signOut: vi.fn()
}))
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => null),
}))

// Polyfill Web File in Node test env
if (typeof (globalThis as any).File === 'undefined') {
  class NodeFile extends Blob {
    name: string
    lastModified: number
    constructor(chunks: any[], name: string, options?: any) {
      super(chunks, options)
      this.name = name
      this.lastModified = Date.now()
    }
  }
  ;(globalThis as any).File = NodeFile as any
}
