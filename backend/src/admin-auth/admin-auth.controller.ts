import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminOriginGuard } from "./origin.guard";
import { CurrentAdmin, PublicAdminRoute } from "./auth.decorators";
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from "./auth.dto";
import type { AdminPrincipal } from "./auth.types";
import { LoginRateLimitGuard } from "./login-rate-limit.guard";

@ApiTags("Admin authentication")
@Controller("admin/auth")
@UseGuards(AdminOriginGuard, AdminAuthGuard)
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}
  @Post("login") @PublicAdminRoute() @UseGuards(LoginRateLimitGuard) login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) { return this.auth.login(dto, request, response); }
  @Post("refresh") @PublicAdminRoute() refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) { return this.auth.refresh(request, response); }
  @Post("logout") @PublicAdminRoute() logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) { return this.auth.logout(request, response); }
  @Post("forgot-password") @PublicAdminRoute() forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto.email); }
  @Post("reset-password") @PublicAdminRoute() reset(@Body() dto: ResetPasswordDto, @Req() request: Request) { return this.auth.resetPassword(dto, request); }
  @Get("me") me(@CurrentAdmin() admin: AdminPrincipal) { return this.auth.profile(admin.id); }
  @Post("logout-all") logoutAll(@CurrentAdmin() admin: AdminPrincipal, @Res({ passthrough: true }) response: Response) { return this.auth.logoutAll(admin.id, response); }
  @Get("sessions") sessions(@CurrentAdmin() admin: AdminPrincipal, @Req() request: Request) { return this.auth.sessions(admin.id, request); }
  @Delete("sessions/:id") revoke(@CurrentAdmin() admin: AdminPrincipal, @Param("id") id: string) { return this.auth.revokeSession(admin.id, id); }
  @Post("change-password") change(@CurrentAdmin() admin: AdminPrincipal, @Body() dto: ChangePasswordDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) { return this.auth.changePassword(admin, dto, request, response); }
}

