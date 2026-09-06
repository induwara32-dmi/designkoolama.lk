import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { environmentSchema } from "./config/environment";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicContentModule } from "./public-content/public-content.module";
import { ContactModule } from "./contact/contact.module";
import { QuotesModule } from "./quotes/quotes.module";
import { resolve } from "node:path";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { AdminCmsModule } from "./admin-cms/admin-cms.module";
import { PublishingModule } from "./publishing/publishing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Vercel (like most hosts) injects real env vars straight into process.env --
      // there is no .env file in the deployed bundle, and there shouldn't be one.
      // Pointing at a real file path only makes sense for local dev and the
      // standalone-server build, where the monorepo keeps its ignored .env two
      // levels above this compiled file (backend/dist/app.module.js -> repo root).
      envFilePath: process.env.VERCEL
        ? undefined
        : resolve(__dirname, "../../.env"),
      validationSchema: environmentSchema,
    }),
    HealthModule,
    PrismaModule,
    PublicContentModule,
    ContactModule,
    QuotesModule,
    AdminAuthModule, AdminCmsModule, PublishingModule,
  ],
})
export class AppModule {}
