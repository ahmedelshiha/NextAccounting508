import { vi } from 'vitest'

// Default mocks to avoid Next.js headers() runtime issues in tests
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null),
  // other exports if needed
}))
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => null),
}))
