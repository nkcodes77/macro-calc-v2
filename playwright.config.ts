import { defineConfig, devices } from '@playwright/test'

// WebKit is Safari's engine, so CI tests match the iPhone. PW_BROWSER=chromium is a local fallback only.
const browser = process.env.PW_BROWSER === 'chromium' ? 'chromium' : 'webkit'
const base = process.env.BASE_PATH ?? '/macro-calc-v2/'

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:4173${base}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: `iphone-${browser}`,
      use: { ...devices['iPhone 13'], defaultBrowserType: browser },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env.CI,
  },
})
