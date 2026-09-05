import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { AdminRequest } from "../admin-auth/request.types";
import { RateLimitStore } from "../common/rate-limit-store";

@Injectable()
export class MediaUploadRateLimitGuard implements CanActivate{
 private readonly store=new RateLimitStore(60_000);
 canActivate(context:ExecutionContext){const request=context.switchToHttp().getRequest<AdminRequest>(),key=request.admin?.id??request.ip??"unknown";if(this.store.isLimited(key,10))throw new HttpException("Too many image upload attempts",HttpStatus.TOO_MANY_REQUESTS);return true}
}
