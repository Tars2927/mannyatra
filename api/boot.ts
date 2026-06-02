import type { HttpBindings } from "@hono/node-server";
import { env } from "./lib/env";
import app from "./app";

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app as any);

  const port = parseInt(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || "9000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
