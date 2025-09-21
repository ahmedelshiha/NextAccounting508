import { vi } from 'vitest'

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
    type: string
    constructor(chunks: any[], name: string, options?: any) {
      super(chunks, options)
      this.name = name
      this.lastModified = Date.now()
      this.type = options?.type || ''
    }
  }
  ;(globalThis as any).File = NodeFile as any
}
