import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { environmentSchema } from "./config/environment";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentSchema,
    }),
    HealthModule,
  ],
})
export class AppModule {}
