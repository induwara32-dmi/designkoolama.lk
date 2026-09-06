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
// long-running process (local dev, or a traditional Node host); the Next.js App
// Router Route Handler at frontend/src/app/api/[...path]/route.ts calls this once
// per cold start against an Express instance it bridges Fetch-based requests into,
// with no port ever bound. Neither caller re-implements any of this -- only how the
// resulting Express instance is served differs.
export async function createNestApp(
  expressInstance: Express,
): Promise<INestApplication> {
  if (process.env.VERCEL) {
    // On Vercel the request never has a real socket -- the /api/[...path] Route
    // Handler synthesizes one to bridge Next.js's Fetch-based Request into this
    // Express app, so req.ip would otherwise resolve to nothing and every client
    // would collapse into the same rate-limit bucket (keyed on req.ip). Vercel's
    // edge network sets x-forwarded-for itself and strips/overwrites whatever a
    // client sent, so trusting it here is safe -- this must stay conditional on
    // actually running behind that trusted proxy, since blindly trusting
    // X-Forwarded-For elsewhere would let a client spoof its own rate-limit key.
    expressInstance.set("trust proxy", true);
  }
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
