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
