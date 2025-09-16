import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Some route modules use JSON imports or rely on modern JS features
    deps: {
      inline: [
        // keep empty for now; add packages here if Vitest struggles to pre-bundle
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
