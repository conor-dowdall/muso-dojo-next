import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;
const coreTestIgnore = [
  /\.audio\.spec\.ts$/,
  /\.mobile\.spec\.ts$/,
  /\.pwa\.spec\.ts$/,
];

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview",
    env: {
      PORT: String(port),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    url: baseURL,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: coreTestIgnore,
      use: {
        ...devices["Desktop Chrome"],
        serviceWorkers: "block",
      },
    },
    {
      name: "firefox",
      testIgnore: coreTestIgnore,
      use: {
        ...devices["Desktop Firefox"],
        serviceWorkers: "block",
      },
    },
    {
      name: "webkit",
      testIgnore: coreTestIgnore,
      use: {
        ...devices["Desktop Safari"],
        serviceWorkers: "block",
      },
    },
    {
      name: "mobile-chromium",
      testMatch: /\.mobile\.spec\.ts$/,
      use: {
        ...devices["Pixel 7"],
        serviceWorkers: "block",
      },
    },
    {
      name: "audio-chromium",
      testMatch: /\.audio\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        serviceWorkers: "allow",
      },
    },
    {
      name: "pwa-chromium",
      testMatch: /\.pwa\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        serviceWorkers: "allow",
      },
    },
  ],
});
