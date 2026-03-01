import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..')

export default defineConfig({
  testDir: './specs',
  timeout: 15_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',

  use: {
    // Samples are served as file:// URLs — no server needed.
    baseURL: `file://${rootDir}/samples/vanilla-js`,
    // Every test gets a fresh context; no shared state.
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
