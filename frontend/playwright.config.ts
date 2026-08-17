import { defineConfig } from "@playwright/test";

export default defineConfig({ testDir: "./e2e", outputDir: "./phase3-run-results", use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" }, reporter: "list" });
