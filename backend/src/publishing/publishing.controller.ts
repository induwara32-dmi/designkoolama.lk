import { Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../admin-auth/admin-auth.guard";
import { CurrentAdmin, Roles } from "../admin-auth/auth.decorators";
import type { AdminPrincipal } from "../admin-auth/auth.types";
import { RolesGuard } from "../admin-auth/roles.guard";
import { PublishingService } from "./publishing.service";
@ApiTags("Admin publishing") @Controller("admin/publishing") @UseGuards(AdminAuthGuard,RolesGuard) @Roles("SUPER_ADMIN","CONTENT_MANAGER","PORTFOLIO_MANAGER")
export class PublishingController{
 constructor(private readonly publishing:PublishingService){}
 private resource(value:string,admin:AdminPrincipal){const resource=this.publishing.ensureResource(value);if(admin.roles.includes("SUPER_ADMIN"))return resource;const allowed=admin.roles.includes("PORTFOLIO_MANAGER")?["portfolio","portfolio-categories"]:admin.roles.includes("CONTENT_MANAGER")?["pages","services","packages","testimonials"]:[];if(!allowed.includes(resource))throw new ForbiddenException("Insufficient publishing permissions");return resource}
 @Get(":resource/:id/revisions") revisions(@Param("resource")value:string,@Param("id")id:string,@CurrentAdmin()admin:AdminPrincipal){return this.publishing.revisions(this.resource(value,admin),id)}
 @Post(":resource/:id/preview") preview(@Param("resource")value:string,@Param("id")id:string,@CurrentAdmin()admin:AdminPrincipal){return this.publishing.preview(this.resource(value,admin),id,admin)}
 @Post(":resource/:id/publish") publish(@Param("resource")value:string,@Param("id")id:string,@CurrentAdmin()admin:AdminPrincipal){return this.publishing.publish(this.resource(value,admin),id,admin)}
 @Post(":resource/:id/unpublish") unpublish(@Param("resource")value:string,@Param("id")id:string,@CurrentAdmin()admin:AdminPrincipal){return this.publishing.unpublish(this.resource(value,admin),id,admin)}
}
@ApiTags("Content preview") @Controller("preview")
export class PreviewController{
 constructor(private readonly publishing:PublishingService){}
 @Get(":resource/:id") data(@Param("resource")value:string,@Param("id")id:string,@Query("token")token:string){return this.publishing.previewData(this.publishing.ensureResource(value),id,token)}
}
