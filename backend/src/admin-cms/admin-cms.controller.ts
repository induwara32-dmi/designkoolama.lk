import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../admin-auth/admin-auth.guard";
import { CurrentAdmin, Roles } from "../admin-auth/auth.decorators";
import type { AdminPrincipal } from "../admin-auth/auth.types";
import { RolesGuard } from "../admin-auth/roles.guard";
import { AdminCmsService } from "./admin-cms.service";
import { CmsListQueryDto, CmsMutationDto, SubmissionStatusDto, cmsResources, type CmsResource } from "./admin-cms.dto";

@ApiTags("Admin CMS") @Controller("admin/cms") @UseGuards(AdminAuthGuard,RolesGuard)
export class AdminCmsController{
 constructor(private readonly cms:AdminCmsService){}
 private resource(value:string){if(!cmsResources.includes(value as CmsResource))throw new BadRequestException("Unsupported CMS resource");return value as CmsResource}
 private authorize(admin:AdminPrincipal,resource:CmsResource,write=false){if(admin.roles.includes("SUPER_ADMIN"))return;const allowed=admin.roles.includes("INQUIRY_MANAGER")?["quotes","contacts"]:admin.roles.includes("PORTFOLIO_MANAGER")?["portfolio","portfolio-categories","media"]:admin.roles.includes("CONTENT_MANAGER")?["pages","services","package-categories","packages","testimonials","media","settings"]:[];if(!allowed.includes(resource)||write&&["quotes","contacts","activity"].includes(resource))throw new ForbiddenException("Insufficient permissions for this CMS resource")}
 @Get(":resource") @Roles("SUPER_ADMIN","CONTENT_MANAGER","PORTFOLIO_MANAGER","INQUIRY_MANAGER") list(@Param("resource")value:string,@Query()query:CmsListQueryDto,@CurrentAdmin()admin:AdminPrincipal){const resource=this.resource(value);this.authorize(admin,resource);return this.cms.list(resource,query)}
 @Post(":resource") @Roles("SUPER_ADMIN","CONTENT_MANAGER","PORTFOLIO_MANAGER") create(@Param("resource")value:string,@Body()dto:CmsMutationDto,@CurrentAdmin()admin:AdminPrincipal){const resource=this.resource(value);this.authorize(admin,resource,true);return this.cms.create(resource,dto.data,admin)}
 @Patch(":resource/:id") @Roles("SUPER_ADMIN","CONTENT_MANAGER","PORTFOLIO_MANAGER") update(@Param("resource")value:string,@Param("id")id:string,@Body()dto:CmsMutationDto,@CurrentAdmin()admin:AdminPrincipal){const resource=this.resource(value);this.authorize(admin,resource,true);return this.cms.update(resource,id,dto.data,admin)}
 @Patch(":resource/:id/status") @Roles("SUPER_ADMIN","INQUIRY_MANAGER") updateSubmission(@Param("resource")resource:string,@Param("id")id:string,@Body()dto:SubmissionStatusDto,@CurrentAdmin()admin:AdminPrincipal){if(resource!=="quotes"&&resource!=="contacts")throw new BadRequestException("Unsupported submission resource");this.authorize(admin,resource);return this.cms.updateSubmission(resource,id,dto.status,admin)}
 @Delete(":resource/:id") @Roles("SUPER_ADMIN","CONTENT_MANAGER","PORTFOLIO_MANAGER") remove(@Param("resource")value:string,@Param("id")id:string,@CurrentAdmin()admin:AdminPrincipal){const resource=this.resource(value);this.authorize(admin,resource,true);return this.cms.remove(resource,id,admin)}
}
