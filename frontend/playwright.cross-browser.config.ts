import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "phase10.spec.ts",
  workers: 1,
  outputDir: "./phase10-run-results",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          env: { ...process.env, MOZ_HEADLESS: "1", MOZ_WEBRENDER: "0" },
          firefoxUserPrefs: {
            "gfx.webrender.all": false,
            "gfx.webrender.software": false,
            "layers.acceleration.disabled": true,
          },
        },
      },
    },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
