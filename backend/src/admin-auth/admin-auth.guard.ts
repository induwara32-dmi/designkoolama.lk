import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { AccessClaims } from "./auth.types";
import type { AdminRequest } from "./request.types";
import { PUBLIC_KEY } from "./auth.decorators";
import { readCookie, verifyAccessToken } from "./security";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly config: ConfigService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = readCookie(request.headers.cookie, "dk_admin_access");
    const claims = token ? verifyAccessToken<AccessClaims>(token, this.config.getOrThrow("ADMIN_ACCESS_TOKEN_SECRET")) : null;
    if (!claims || claims.type !== "access" || claims.exp <= Math.floor(Date.now() / 1000)) throw new UnauthorizedException("Authentication required");
    const session = await this.prisma.refreshSession.findFirst({ where: { id: claims.sid, userId: claims.sub, revokedAt: null, expiresAt: { gt: new Date() }, user: { status: "ACTIVE", deletedAt: null } }, include: { user: { include: { roles: { include: { role: true } } } } } });
    if (!session) throw new UnauthorizedException("Authentication required");
    const user = session.user;
    request.admin = { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles.map((item) => item.role.name), sessionId: session.id };
    return true;
  }
}
