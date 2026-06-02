import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler, createGoogleAuthRedirectHandler } from "./google/auth";
import { Paths } from "@contracts/constants";
import { fetchDestinationPreview } from "./lib/wikipedia";

const app = new Hono();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(secureHeaders());
app.use(bodyLimit({ maxSize: 2 * 1024 * 1024 })); // 2MB limit

// CORS — restrict in production to same-origin only
app.use(
  "/api/*",
  cors({
    origin: env.isProduction
      ? (origin) => origin // same-origin only
      : "*",
    credentials: true,
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  })
);

// ── Rate limiter with automatic cleanup ───────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now - record.lastReset > 120_000) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000);

const rateLimiter = (limit: number, windowMs: number) => async (c: any, next: any) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now - record.lastReset > windowMs) {
    record = { count: 0, lastReset: now };
  }
  record.count++;
  rateLimitMap.set(ip, record);
  if (record.count > limit) {
    return c.json({ error: "Too many requests" }, 429);
  }
  await next();
};

// ── Routes ────────────────────────────────────────────────────────────────────

// Google OAuth: redirect to consent screen
app.get("/api/auth/google", createGoogleAuthRedirectHandler());

// Google OAuth: callback after consent
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Live destination preview endpoint — called by the frontend while user types
app.get("/api/preview", rateLimiter(60, 60_000), async (c) => {
  const destination = (c.req.query("destination") ?? "").trim();
  if (!destination) return c.json({ name: "", summary: "", image: "", url: "", subtitle: "", lat: null, lon: null });
  const preview = await fetchDestinationPreview(destination);
  return c.json(preview);
});

// tRPC — rate limited in production
app.use("/api/trpc/*", rateLimiter(120, 60_000), async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
