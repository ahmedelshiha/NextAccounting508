import { defineConfig, devices } from '@playwright/test'

import { defineConfig, devices } from '@playwright/test'

const isNetlify = Boolean(process.env.NETLIFY)

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
  // On Netlify, limit to Chromium to avoid system deps required by WebKit
  projects: isNetlify
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } }
      ]
})
