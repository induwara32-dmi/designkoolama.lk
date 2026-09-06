import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Express } from "express";
import helmet from "helmet";
import { json } from "express";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { shouldExposeSwagger } from "./config/deployment-security";

// Everything the app needs configured (security headers, body limits, CORS, global
// pipes/interceptors, Swagger) lives here so it runs identically whichever way the
// app is hosted: `main.ts` calls this once and then binds a port for a normal
// long-running process (local dev, or a traditional Node host); the serverless
// entry point (`api/[...path].ts` at the repo root) calls this once per cold start
// against an Express instance it hands straight to the platform, with no port bound
// at all. Neither caller re-implements any of this -- only how the resulting
// Express instance is served differs.
export async function createNestApp(
  expressInstance: Express,
): Promise<INestApplication> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
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
  if (
    shouldExposeSwagger(
      config.get<string>("NODE_ENV"),
      config.get<boolean>("SWAGGER_ENABLED"),
    )
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DesignKoolama API")
      .setDescription("Public website and private CMS API")
      .setVersion("1.0")
      .addCookieAuth("access_token")
      .build();
    SwaggerModule.setup(
      "docs",
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }
  // init(), not listen(): this runs the full Nest lifecycle (module resolution,
  // onModuleInit hooks -- including PrismaService.$connect()) and wires the
  // Express instance's routes without binding a TCP port. The caller decides
  // whether to listen (main.ts) or hand the now-fully-wired Express instance to a
  // serverless platform's request/response objects directly (api/[...path].ts).
  await app.init();
  return app;
}
