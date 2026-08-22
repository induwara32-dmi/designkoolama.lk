import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PreviewContextService } from "./preview-context.service";
import { PreviewController, PublishingController } from "./publishing.controller";
import { PublishingService } from "./publishing.service";
@Module({imports:[PrismaModule,AdminAuthModule],controllers:[PublishingController,PreviewController],providers:[PublishingService,PreviewContextService]})
export class PublishingModule{}
