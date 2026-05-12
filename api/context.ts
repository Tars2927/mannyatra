import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./google/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

// Dev bypass: inject a synthetic user when Google OAuth isn't configured
const isDevBypass = !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your-client-id.apps.googleusercontent.com";

const DEV_USER: User = {
  id: 0,
  unionId: "dev-local",
  name: "Local User",
  email: "dev@localhost",
  avatar: "",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  if (isDevBypass) {
    ctx.user = DEV_USER;
    return ctx;
  }

  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}

