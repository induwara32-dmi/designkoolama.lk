import {Controller,Get,Param,Query} from "@nestjs/common";
import {ApiOperation,ApiTags} from "@nestjs/swagger";
import {PackageQueryDto,PortfolioQueryDto} from "./public-content.dto";
import {PublicContentService} from "./public-content.service";
@ApiTags("public") @Controller("public")
export class PublicContentController{
 constructor(private readonly content:PublicContentService){}
 @Get("pages/:slug") @ApiOperation({summary:"Get a published page"}) page(@Param("slug") slug:string){return this.content.page(slug)}
 @Get("services") @ApiOperation({summary:"List published services"}) services(){return this.content.services()}
 @Get("services/:slug") @ApiOperation({summary:"Get a published service"}) service(@Param("slug") slug:string){return this.content.service(slug)}
 @Get("portfolio") @ApiOperation({summary:"List published portfolio projects"}) portfolio(@Query() query:PortfolioQueryDto){return this.content.portfolio(query)}
 @Get("portfolio/:slug") @ApiOperation({summary:"Get a published portfolio project"}) project(@Param("slug") slug:string){return this.content.project(slug)}
 @Get("packages") @ApiOperation({summary:"List active published packages"}) packages(@Query() query:PackageQueryDto){return this.content.packages(query)}
 @Get("packages/:slug") @ApiOperation({summary:"Get an active published package"}) package(@Param("slug") slug:string){return this.content.package(slug)}
 @Get("testimonials") testimonials(){return this.content.testimonials()}
 @Get("settings") settings(){return this.content.settings()}
}
