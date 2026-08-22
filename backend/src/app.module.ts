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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, "../../.env"),
      validationSchema: environmentSchema,
    }),
    HealthModule,
    PrismaModule,
    PublicContentModule,
    ContactModule,
    QuotesModule,
    AdminAuthModule,
  ],
})
export class AppModule {}
