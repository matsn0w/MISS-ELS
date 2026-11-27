import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 4173);

// The tests run against the generated site; run `npm run generate` first
// (`npm test` does both).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: `http://localhost:${port}/MISS-ELS/`,
    trace: "on-first-retry",
    launchOptions: {
      // lets a machine with a pre-installed Chromium skip `playwright install`
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],

  webServer: {
    command: "node tests/serve.mjs",
    url: `http://localhost:${port}/MISS-ELS/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
});
