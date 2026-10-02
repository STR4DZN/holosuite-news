import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.HN_BROWSER_PATH
      ? {
          executablePath: process.env.HN_BROWSER_PATH,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--disable-gpu",
          ],
        }
      : {},
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
