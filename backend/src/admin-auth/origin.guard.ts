import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class AdminOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    const origin = request.headers.origin;
    const allowed = new Set([this.config.getOrThrow<string>("ADMIN_FRONTEND_URL")]);
    if (this.config.get<string>("NODE_ENV") !== "production") { allowed.add("http://localhost:3000"); allowed.add("http://127.0.0.1:3000"); }
    if (!origin || !allowed.has(origin)) throw new ForbiddenException("Untrusted request origin");
    return true;
  }
}

