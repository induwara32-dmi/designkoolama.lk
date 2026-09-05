import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { RateLimitStore } from "../common/rate-limit-store";

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly store = new RateLimitStore(15 * 60_000);
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? "unknown";
    if (this.store.isLimited(key, 10)) throw new HttpException("Too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
