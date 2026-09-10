import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { Duplex } from "node:stream";
import express, { type Express } from "express";
// Compiled output, not backend/src -- see backend/src/create-app.ts for why (this
// file shares frontend's tsconfig, which doesn't enable the decorator syntax Nest's
// controllers/providers use; importing the already-compiled .js + its .d.ts
// sidesteps that entirely).
import { createNestApp } from "../../../../../backend/dist/create-app";

// Vercel's current, documented convention for a Next.js App Router project: a
// function is defined as a Route Handler under app/api/.../route.ts. A bare
// top-level api/ directory (sibling to src/app/) is a DIFFERENT, unsupported
// convention here -- that's officially the pattern for non-Next.js ("other")
// projects only. This project previously used a top-level frontend/api/[...path].ts
// file, which Next.js's own App Router silently owned the /api/* namespace for and
// never delegated to -- every request 404'd via Next's own not-found page,
// confirmed live (X-Matched-Path: /_not-found on every /api/* request, including
// ones that should have reached the function). Moving the exact same logic here,
// as a real Route Handler, is the fix.
export const runtime = "nodejs";
export const maxDuration = 30;

// One NestJS app per warm container, not per request -- see the original comment
// history in the now-removed frontend/api/[...path].ts for the full reasoning
// (cold start pays for bootstrap once; every request on a warm instance reuses the
// same Express/Nest app and its one pooled Prisma connection).
let serverPromise: Promise<Express> | undefined;

function getServer(): Promise<Express> {
  if (!serverPromise) {
    const server = express();
    serverPromise = createNestApp(server)
      .then(() => server)
      .catch((error: unknown) => {
        serverPromise = undefined;
        throw error;
      });
  }
  return serverPromise;
}

// Route Handlers speak the Fetch API (Request/Response), but the NestJS app is
// wired onto a real Express instance, which only understands Node's classic
// (req, res) callback style. There is no off-the-shelf package for this exact
// direction of bridging (the well-known adapters -- @mjackson/node-fetch-server,
// @whatwg-node/server -- all convert the other way: wrapping a Fetch-style handler
// to run on a real Node http.Server). So this constructs a real, minimal
// IncomingMessage/ServerResponse pair by hand: a real Duplex stream stands in for
// the ServerResponse's socket (giving correct cork/uncork and backpressure
// semantics for free, unlike hand-overriding a raw net.Socket's write method) and
// simply buffers whatever Express/Nest writes to it, which becomes the Response
// returned to Next.js once the real ServerResponse fires "finish".
async function bridgeToExpress(server: Express, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requestSocket = new Socket();
  const req = new IncomingMessage(requestSocket);
  req.method = request.method;
  req.url = `${url.pathname}${url.search}`;

  const bodyBuffer =
    request.method === "GET" || request.method === "HEAD"
      ? Buffer.alloc(0)
      : Buffer.from(await request.arrayBuffer());

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  // body-parser's hasBody() check (which every Express body parser relies on to
  // decide whether to read the stream at all) looks for a real content-length or
  // transfer-encoding header -- neither is guaranteed to survive faithfully through
  // the Fetch Request object, so without this every POST/PATCH/PUT body was
  // silently discarded (req.body stayed {}) despite the correct bytes actually
  // being pushed into the stream underneath. Always set it from the buffer we're
  // actually about to push, not whatever the original request happened to carry.
  headers["content-length"] = String(bodyBuffer.length);
  req.headers = headers;

  const chunks: Buffer[] = [];
  const responseSocket = new Duplex({
    read() {
      // Nothing ever reads from this side; Express only writes.
    },
    write(chunk, encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      callback();
    },
  });

  const res = new ServerResponse(req);
  res.assignSocket(responseSocket as unknown as Socket);

  const finished = new Promise<void>((resolvePromise, rejectPromise) => {
    res.once("finish", resolvePromise);
    res.once("error", rejectPromise);
    requestSocket.once("error", rejectPromise);
  });

  req.push(bodyBuffer.length ? bodyBuffer : null);
  if (bodyBuffer.length) req.push(null);

  try {
    server(req, res);
    await finished;
  } finally {
    res.detachSocket(responseSocket as unknown as Socket);
    requestSocket.destroy();
    responseSocket.destroy();
  }

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(res.getHeaders())) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((entry) => responseHeaders.append(key, String(entry)));
    else responseHeaders.set(key, String(value));
  }

  // A ServerResponse with an assigned socket writes the full raw HTTP/1.1 wire
  // format to it -- status line and header block included, not just the body --
  // since that's what a real socket is for. res.statusCode/getHeaders() above
  // already give the real values structurally, so the only thing needed from the
  // captured bytes is what comes after the header block's terminating blank line.
  // A response can never contain "\r\n\r\n" before that point (a header line can't
  // contain a blank line), so the first occurrence is always the true boundary.
  const raw = Buffer.concat(chunks);
  const headerBoundary = raw.indexOf("\r\n\r\n");
  const rawBody = headerBoundary === -1 ? raw : raw.subarray(headerBoundary + 4);

  // The Fetch spec forbids a body on "null body status" responses (204, 205, 304)
  // -- the Response constructor throws if given one regardless of whether the body
  // is actually empty. A conditional GET that hits an ETag match (a normal browser
  // revalidation, not an edge case) makes Express/Nest answer 304, which crashed
  // every such request with "Invalid response status code 304" until this check.
  const isNullBodyStatus = res.statusCode === 204 || res.statusCode === 205 || res.statusCode === 304;
  const body = isNullBodyStatus ? null : rawBody;

  return new Response(body, {
    status: res.statusCode,
    statusText: res.statusMessage || undefined,
    headers: responseHeaders,
  });
}

async function handle(request: Request): Promise<Response> {
  const server = await getServer();
  return bridgeToExpress(server, request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
