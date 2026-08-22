import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PublishableResource } from "./publishing.types";
type Claims={resource:PublishableResource;entityId:string;adminId:string;exp:number};
@Injectable()
export class PreviewContextService{
 constructor(private readonly config:ConfigService){}
 private secret(){const production=this.config.get<string>("NODE_ENV")==="production";const value=this.config.get<string>("CONTENT_PREVIEW_SECRET")??(!production?this.config.get<string>("ADMIN_ACCESS_TOKEN_SECRET"):undefined);if(!value||value.length<32)throw new BadRequestException("Content preview is not configured");return value}
 ttlSeconds(){return this.config.get<number>("CONTENT_PREVIEW_TTL_SECONDS")??900}
 sign(resource:PublishableResource,entityId:string,adminId:string){const encoded=Buffer.from(JSON.stringify({resource,entityId,adminId,exp:Math.floor(Date.now()/1000)+this.ttlSeconds()} satisfies Claims)).toString("base64url");const signature=createHmac("sha256",this.secret()).update(encoded).digest("base64url");return `${encoded}.${signature}`}
 verify(token:string,resource:PublishableResource,entityId:string){const [encoded,signature]=token.split(".");if(!encoded||!signature)throw new UnauthorizedException("Invalid preview context");const expected=createHmac("sha256",this.secret()).update(encoded).digest("base64url");const left=Buffer.from(signature),right=Buffer.from(expected);if(left.length!==right.length||!timingSafeEqual(left,right))throw new UnauthorizedException("Invalid preview context");let claims:Claims;try{claims=JSON.parse(Buffer.from(encoded,"base64url").toString("utf8")) as Claims}catch{throw new UnauthorizedException("Invalid preview context")}if(claims.resource!==resource||claims.entityId!==entityId||claims.exp<=Math.floor(Date.now()/1000))throw new UnauthorizedException("Expired or invalid preview context");return claims}
}
