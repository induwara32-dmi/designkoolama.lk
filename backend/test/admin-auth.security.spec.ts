import type { ExecutionContext } from "@nestjs/common";
import { AdminAuthGuard } from "../src/admin-auth/admin-auth.guard";
import { LoginRateLimitGuard } from "../src/admin-auth/login-rate-limit.guard";
import { RolesGuard } from "../src/admin-auth/roles.guard";
import { assertStrongPassword, hashPassword, hashToken, randomToken, readCookie, signAccessToken, verifyAccessToken, verifyPassword } from "../src/admin-auth/security";

describe("admin authentication security primitives", () => {
  const secret="test-only-secret-material-that-is-long-enough";
  it("hashes and verifies a strong password",async()=>{const value=await hashPassword("StrongPassword!42");expect(value).not.toContain("StrongPassword!42");await expect(verifyPassword("StrongPassword!42",value)).resolves.toBe(true)});
  it("rejects an incorrect password",async()=>{const value=await hashPassword("StrongPassword!42");await expect(verifyPassword("wrong",value)).resolves.toBe(false)});
  it("enforces password length",()=>expect(assertStrongPassword("Ab1!short")).toBe(false));
  it("enforces password complexity",()=>expect(assertStrongPassword("alllowercasepassword")).toBe(false));
  it("generates distinct opaque reset tokens",()=>{const a=randomToken(),b=randomToken();expect(a).not.toBe(b);expect(a.length).toBeGreaterThan(40)});
  it("uses deterministic one-way token hashes",()=>{expect(hashToken("a")).toBe(hashToken("a"));expect(hashToken("a")).not.toBe(hashToken("b"))});
  it("signs and verifies access claims",()=>{const token=signAccessToken({sub:"admin",sid:"session",roles:["SUPER_ADMIN"],exp:Math.floor(Date.now()/1000)+60,type:"access"},secret);expect(verifyAccessToken<{sub:string}>(token,secret)?.sub).toBe("admin")});
  it("rejects tampered access tokens",()=>{const token=signAccessToken({sub:"admin",sid:"session",roles:[],exp:Math.floor(Date.now()/1000)+60,type:"access"},secret);expect(verifyAccessToken(`${token}x`,secret)).toBeNull()});
  it("retains expiry for the authentication guard to enforce",()=>{const token=signAccessToken({sub:"admin",sid:"session",roles:[],exp:1,type:"access"},secret);expect(verifyAccessToken<{exp:number}>(token,secret)?.exp).toBe(1)});
  it("parses an encoded cookie without accepting similarly named cookies",()=>{expect(readCookie("x=1; dk_admin_refresh=a%2Bb; dk_admin_refresh_extra=no","dk_admin_refresh")).toBe("a+b")});
});

describe("admin guards",()=>{
  it("requires an authenticated principal",()=>{const reflector={getAllAndOverride:jest.fn().mockReturnValue(false)} as never;const config={getOrThrow:jest.fn()} as never;const prisma={} as never;const guard=new AdminAuthGuard(reflector,config,prisma);const context={getHandler:jest.fn(),getClass:jest.fn(),switchToHttp:()=>({getRequest:()=>({headers:{}})})} as unknown as ExecutionContext;return expect(guard.canActivate(context)).rejects.toThrow("Authentication required")});
  it("permits public admin routes",async()=>{const reflector={getAllAndOverride:jest.fn().mockReturnValue(true)} as never;const guard=new AdminAuthGuard(reflector,{} as never,{} as never);await expect(guard.canActivate({getHandler:jest.fn(),getClass:jest.fn()} as unknown as ExecutionContext)).resolves.toBe(true)});
  it("enforces role membership",()=>{const reflector={getAllAndOverride:jest.fn().mockReturnValue(["Super Admin"])} as never;const guard=new RolesGuard(reflector);const context={getHandler:jest.fn(),getClass:jest.fn(),switchToHttp:()=>({getRequest:()=>({admin:{roles:["Editor"]}})})} as unknown as ExecutionContext;expect(()=>guard.canActivate(context)).toThrow("Insufficient permissions")});
  it("limits repeated login attempts by IP",()=>{const guard=new LoginRateLimitGuard();const context={switchToHttp:()=>({getRequest:()=>({ip:"127.0.0.1"})})} as unknown as ExecutionContext;for(let i=0;i<10;i++)expect(guard.canActivate(context)).toBe(true);expect(()=>guard.canActivate(context)).toThrow("Too many login attempts")});
});
