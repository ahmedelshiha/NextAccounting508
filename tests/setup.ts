import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock prisma to avoid requiring a real DB in tests
(() => {
  let thresholds: any[] = []
  vi.mock('@/lib/prisma', () => ({
    default: {
      healthThreshold: {
        findFirst: async ({ orderBy }: any) => {
          return thresholds.length ? thresholds[thresholds.length - 1] : null
        },
        create: async ({ data }: any) => {
          const id = thresholds.length + 1
          const rec = { id, ...data }
          thresholds.push(rec)
          return rec
        },
        update: async ({ where, data }: any) => {
          const rec = thresholds.find((r) => r.id === where.id)
          if (!rec) throw new Error('not found')
          Object.assign(rec, data)
          return rec
        },
        deleteMany: async () => { thresholds = []; return { count: 0 } },
      },
      $disconnect: async () => {},
    }
  }))
})()

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock scrollTo
window.scrollTo = window.scrollTo || function () {}

// Minimal ResizeObserver mock
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || ResizeObserver
