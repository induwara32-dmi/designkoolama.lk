import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import { RolesGuard } from "./roles.guard";
import { AdminOriginGuard } from "./origin.guard";
import { LoginRateLimitGuard } from "./login-rate-limit.guard";
import { SafeResetDeliveryProvider } from "./reset-delivery.provider";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";

@Module({ controllers: [AdminAuthController, AdminDashboardController], providers: [AdminAuthService, AdminAuthGuard, RolesGuard, AdminOriginGuard, LoginRateLimitGuard, SafeResetDeliveryProvider, AdminDashboardService], exports: [AdminAuthGuard, RolesGuard, AdminOriginGuard] })
export class AdminAuthModule {}
