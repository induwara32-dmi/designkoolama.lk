import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "./admin-auth.guard";
import { Roles } from "./auth.decorators";
import { RolesGuard } from "./roles.guard";
import { AdminDashboardService } from "./admin-dashboard.service";

@ApiTags("Admin dashboard")
@Controller("admin/dashboard")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "CONTENT_MANAGER", "PORTFOLIO_MANAGER", "INQUIRY_MANAGER")
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}
  @Get() overview() { return this.dashboard.overview(); }
}

