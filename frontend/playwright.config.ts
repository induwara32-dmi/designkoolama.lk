import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 3,
  outputDir: "./phase3-run-results",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: [
    {
      command: "node backend/dist/main.js",
      cwd: "..",
      url: "http://127.0.0.1:4000/api/v1/health/ready",
      reuseExistingServer: true,
    },
    {
      command: "npm run start -w frontend",
      cwd: "..",
      env: {
        ...process.env,
        API_URL: "http://127.0.0.1:4000/api/v1",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000/api/v1",
        CONTENT_FALLBACK_ENABLED: "false",
      },
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
    },
  ],
  reporter: "list",
});
