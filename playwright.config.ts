import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://192.168.0.105:3000',
    actionTimeout: 0,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  env: {
    dotenv: ['.env'],
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--disable-dev-shm-usage'],
          slowMo: process.env.CI ? 0 : 100,
        }
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://192.168.0.105:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
