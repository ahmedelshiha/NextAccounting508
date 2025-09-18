import { vi } from 'vitest'

// Default mocks to avoid Next.js headers() runtime issues in tests
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null),
  // other exports if needed
}))
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => null),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: vi.fn()
}))
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => null),
}))
