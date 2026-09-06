import express, { type Express } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
// Compiled output, not backend/src -- see backend/src/create-app.ts for why (this
// file shares frontend's tsconfig, which doesn't enable the decorator syntax Nest's
// controllers/providers use; importing the already-compiled .js + its .d.ts
// sidesteps that entirely, and reuses the exact artifact the backend's own build
// already produces for the standalone server).
//
// This file lives at frontend/api/ -- NOT the repo root -- because Vercel only
// auto-detects a top-level api/ directory as Serverless Functions relative to the
// project's configured Root Directory. This project's Root Directory is
// `frontend`, confirmed by a live 404: a repo-root api/ folder was never deployed
// at all, and every /api/* request was silently falling through into the Next.js
// app's own router (which has no route for it, so it rendered the site's custom
// 404 page instead of ever reaching a function).
import { createNestApp } from "../../backend/dist/create-app";

// One NestJS app per warm container, not per request: a cold start still pays for a
// fresh bootstrap (unavoidable on any serverless platform), but every request that
// lands on an already-warm instance reuses this same Express/Nest app -- including
// its one Prisma connection (see backend/prisma/schema.prisma's directUrl comment
// for why DATABASE_URL must be a pooled connection string here).
let serverPromise: Promise<Express> | undefined;

function getServer(): Promise<Express> {
  if (!serverPromise) {
    const server = express();
    serverPromise = createNestApp(server)
      .then(() => server)
      .catch((error: unknown) => {
        // Don't leave this container permanently wedged on a failed boot (a bad env
        // var, a DB hiccup) -- let the next invocation retry a fresh bootstrap.
        serverPromise = undefined;
        throw error;
      });
  }
  return serverPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const server = await getServer();
  server(req, res);
}
