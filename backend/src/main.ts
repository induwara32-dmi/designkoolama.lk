import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { json } from "express";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { shouldExposeSwagger } from "./config/deployment-security";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(json({ limit: "256kb" }));
  const allowedOrigins = new Set([config.getOrThrow<string>("FRONTEND_URL")]);
  const adminOrigin = config.get<string>("ADMIN_FRONTEND_URL");
  if (adminOrigin) allowedOrigins.add(adminOrigin);
  if (config.get<string>("NODE_ENV") !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }
  app.enableCors({
    origin: [...allowedOrigins],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  if (shouldExposeSwagger(config.get<string>("NODE_ENV"), config.get<boolean>("SWAGGER_ENABLED"))) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DesignKoolama API")
      .setDescription("Public website and private CMS API")
      .setVersion("1.0")
      .addCookieAuth("access_token")
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }
  await app.listen(config.get<number>("PORT", 4000));
}

void bootstrap();
