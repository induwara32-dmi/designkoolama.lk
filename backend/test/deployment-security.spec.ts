import { shouldExposeSwagger } from "../src/config/deployment-security";
import { environmentSchema } from "../src/config/environment";

const productionEnvironment = {
  NODE_ENV: "production",
  FRONTEND_URL: "https://www.example.test",
  DATABASE_URL: "postgresql://user:password@database.example.test:5432/app",
  ADMIN_ACCESS_TOKEN_SECRET: "test-access-secret-material-at-least-32-characters",
  ADMIN_REFRESH_TOKEN_SECRET: "test-refresh-secret-material-at-least-32-characters",
  ADMIN_COOKIE_SECURE: true,
  ADMIN_COOKIE_SAME_SITE: "lax",
  ADMIN_FRONTEND_URL: "https://www.example.test",
  PASSWORD_RESET_FRONTEND_URL: "https://www.example.test/admin/reset-password",
  AUTH_DEV_RESET_PROVIDER: false,
  CONTENT_PREVIEW_SECRET: "test-preview-secret-material-at-least-32-characters",
};

describe("production deployment security", () => {
  it("accepts a secure production configuration", () => {
    expect(environmentSchema.validate(productionEnvironment).error).toBeUndefined();
  });

  it("rejects insecure production cookies", () => {
    expect(environmentSchema.validate({ ...productionEnvironment, ADMIN_COOKIE_SECURE: false }).error).toBeDefined();
  });

  it("rejects non-HTTPS production origins", () => {
    expect(environmentSchema.validate({ ...productionEnvironment, FRONTEND_URL: "http://www.example.test" }).error).toBeDefined();
  });

  it("rejects the development reset provider in production", () => {
    expect(environmentSchema.validate({ ...productionEnvironment, AUTH_DEV_RESET_PROVIDER: true }).error).toBeDefined();
  });

  it("exposes Swagger by default only outside production", () => {
    expect(shouldExposeSwagger("development", false)).toBe(true);
    expect(shouldExposeSwagger("production", false)).toBe(false);
    expect(shouldExposeSwagger("production", true)).toBe(true);
  });
});
