/**
 * Vercel Build Script — uses the Build Output API for full control.
 * Creates .vercel/output/ with static files and the bundled API function.
 */
import { execSync } from "child_process";
import { mkdirSync, cpSync, writeFileSync } from "fs";

// 1. Build the Vite frontend
console.log("▸ Building frontend with Vite...");
execSync("npx vite build", { stdio: "inherit" });

// 2. Bundle the API serverless function with esbuild
console.log("▸ Bundling API function with esbuild...");
const funcDir = ".vercel/output/functions/api.func";
mkdirSync(funcDir, { recursive: true });
execSync(
  `npx esbuild api/index.ts --bundle --platform=node --format=esm --outfile=${funcDir}/index.mjs --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`,
  { stdio: "inherit" }
);

// 3. Write the function config
writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    maxDuration: 30,
  })
);
console.log("▸ Function config written.");

// 4. Copy static files from Vite build output
console.log("▸ Copying static files...");
const staticDir = ".vercel/output/static";
mkdirSync(staticDir, { recursive: true });
cpSync("dist/public", staticDir, { recursive: true });

// 5. Write the routing config
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [
      { src: "/api/(.*)", dest: "/api" },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" },
    ],
  })
);
console.log("▸ Build Output API ready. ✓");
