import {CanActivate,ExecutionContext,HttpException,HttpStatus,Injectable} from "@nestjs/common";
import type {Request} from "express";
import {RateLimitStore} from "../rate-limit-store";
@Injectable()
export class SubmissionRateLimitGuard implements CanActivate{
  private readonly store=new RateLimitStore(60_000);
  canActivate(context:ExecutionContext){const request=context.switchToHttp().getRequest<Request>();const key=request.ip??"unknown";if(this.store.isLimited(key,5))throw new HttpException("Too many requests. Please try again shortly.",HttpStatus.TOO_MANY_REQUESTS);return true}
}
