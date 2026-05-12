import { authRouter } from "./auth-router";
import { destinationRouter } from "./destination-router";
import { inviteRouter } from "./invite-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  destination: destinationRouter,
  invite: inviteRouter,
});

export type AppRouter = typeof appRouter;
