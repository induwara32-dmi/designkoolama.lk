import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import type { AdminPrincipal } from "../src/admin-auth/auth.types";
import { AdminCmsController } from "../src/admin-cms/admin-cms.controller";
import type { AdminCmsService } from "../src/admin-cms/admin-cms.service";
import { MediaUploadRateLimitGuard } from "../src/media/media-upload-rate-limit.guard";
import type { MediaUploadService } from "../src/media/media-upload.service";

describe("media upload authorization", () => {
  const upload = jest.fn().mockResolvedValue({ id: "asset" });
  const controller = new AdminCmsController({} as AdminCmsService, { upload } as unknown as MediaUploadService);
  const principal = (roles: string[]): AdminPrincipal => ({ id: "admin", email: "admin@example.test", displayName: "Admin", roles });

  beforeEach(() => jest.clearAllMocks());

  it("rejects roles without media-write permission", () => {
    expect(() => controller.upload(undefined, "Alt", undefined, principal(["INQUIRY_MANAGER"]))).toThrow(ForbiddenException);
    expect(upload).not.toHaveBeenCalled();
  });

  it.each(["SUPER_ADMIN", "CONTENT_MANAGER", "PORTFOLIO_MANAGER"])("permits the %s role", async (role) => {
    await expect(controller.upload(undefined, "Alt", undefined, principal([role]))).resolves.toEqual({ id: "asset" });
    expect(upload).toHaveBeenCalled();
  });

  it("rate limits repeated attempts per authenticated administrator", () => {
    const guard = new MediaUploadRateLimitGuard();
    const context = { switchToHttp: () => ({ getRequest: () => ({ admin: principal(["SUPER_ADMIN"]), ip: "127.0.0.1" }) }) } as unknown as ExecutionContext;
    for (let index = 0; index < 10; index += 1) expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow("Too many image upload attempts");
  });
});
