import { ConfigService } from "@nestjs/config";
import express from "express";
import { createNestApp } from "./create-app";

// Standalone-process entry point: used for local dev (`npm run dev`) and for
// `npm run start` if this backend is ever hosted as a traditional long-running
// server instead of Vercel Serverless Functions. The Vercel deployment does not
// run this file at all -- see api/[...path].ts at the repo root, which calls the
// same createNestApp() against an Express instance it never binds a port on.
async function bootstrap() {
  const server = express();
  const app = await createNestApp(server);
  const config = app.get(ConfigService);
  await app.listen(config.get<number>("PORT", 4000));
}

void bootstrap();
