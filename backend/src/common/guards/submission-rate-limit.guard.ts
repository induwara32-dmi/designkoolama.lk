import {CanActivate,ExecutionContext,HttpException,HttpStatus,Injectable} from "@nestjs/common";
import type {Request} from "express";
@Injectable()
export class SubmissionRateLimitGuard implements CanActivate{
  private readonly attempts=new Map<string,number[]>();
  canActivate(context:ExecutionContext){const request=context.switchToHttp().getRequest<Request>();const key=request.ip??"unknown";const now=Date.now();const recent=(this.attempts.get(key)??[]).filter(time=>now-time<60_000);if(recent.length>=5)throw new HttpException("Too many requests. Please try again shortly.",HttpStatus.TOO_MANY_REQUESTS);recent.push(now);this.attempts.set(key,recent);return true}
}
