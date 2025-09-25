import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    actionTimeout: 10_000,
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
})
