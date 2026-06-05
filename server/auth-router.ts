import * as cookie from "cookie";
import { Session } from "../contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { env } from "./lib/env";

// When Google OAuth credentials aren't configured, provide a dev user
// so the app is usable locally without a database or Google Cloud project.
const isDevBypass = !env.googleClientId || env.googleClientId === "your-client-id.apps.googleusercontent.com";

const DEV_USER = {
  id: 0,
  unionId: "dev-local",
  name: "Local User",
  email: "dev@localhost",
  avatar: "",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export const authRouter = isDevBypass
  ? createRouter({
      me: publicQuery.query(() => ({
        name: DEV_USER.name,
        email: DEV_USER.email,
        avatar: DEV_USER.avatar,
      })),
      logout: publicQuery.mutation(() => ({ success: true })),
    })
  : createRouter({
      me: authedQuery.query((opts) => ({
        name: opts.ctx.user.name,
        email: opts.ctx.user.email,
        avatar: opts.ctx.user.avatar,
      })),
      logout: authedQuery.mutation(async ({ ctx }) => {
        const opts = getSessionCookieOptions(ctx.req.headers);
        ctx.resHeaders.append(
          "set-cookie",
          cookie.serialize(Session.cookieName, "", {
            httpOnly: opts.httpOnly,
            path: opts.path,
            sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
            secure: opts.secure,
            maxAge: 0,
          }),
        );
        return { success: true };
      }),
    });
