// Enable Prisma mock mode for tests
process.env.PRISMA_MOCK = process.env.PRISMA_MOCK ?? 'true'

import { mockPrisma, resetPrismaMock } from '../__mocks__/prisma'

// Expose the mock on the global object so tests can import and customize behavior
;(globalThis as any).prismaMock = mockPrisma

// Reset mocks between tests when a test runner supports the setup file lifecycle
export function setupTests() {
  beforeEach(() => {
    resetPrismaMock()
  })
}

// Auto-run the setup for environments that import this file directly
try {
  // If running under Vitest/Jest, call setupTests to register hooks
  setupTests()
} catch (e) {
  // noop if test runner does not support global hook registration at import time
}
