import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./auth.decorators";
import type { AdminRequest } from "./request.types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    if (!required.length) return true;
    const roles = context.switchToHttp().getRequest<AdminRequest>().admin?.roles ?? [];
    if (!required.some((role) => roles.includes(role))) throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}

