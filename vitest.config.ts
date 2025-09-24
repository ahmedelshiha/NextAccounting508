import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@testing-library/react': path.resolve(__dirname, 'test-mocks/testing-library-react.ts')
    },
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/**/nav/**/*.test.tsx', 'jsdom'],
      ['tests/**/realtime/**/*.test.tsx', 'jsdom'],
      ['**/*.dom.test.tsx', 'jsdom']
    ],
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/app/admin/tasks/tests/**/*'],
    testTimeout: 60000
  }
})
