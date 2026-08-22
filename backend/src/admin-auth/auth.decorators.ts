import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { AdminRequest } from "./request.types";

export const ROLES_KEY = "admin_roles";
export const PUBLIC_KEY = "admin_public";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const PublicAdminRoute = () => SetMetadata(PUBLIC_KEY, true);
export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AdminRequest>().admin);

