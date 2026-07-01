import { mkdir, copyFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await mkdir(resolve(dist, "cli"), { recursive: true });
await mkdir(resolve(dist, "injected"), { recursive: true });

await build({
  entryPoints: [resolve(root, "src/cli/index.ts")],
  outfile: resolve(dist, "cli/index.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  external: ["playwright"],
  banner: {
    js: "#!/usr/bin/env node"
  }
});

await build({
  entryPoints: [resolve(root, "src/injected/overlay.ts")],
  outfile: resolve(dist, "injected/overlay.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2020",
  define: {
    WISPPATCH_CSS: JSON.stringify(
      await readFile(resolve(root, "src/injected/styles.css"), "utf8")
    )
  }
});

await copyFile(
  resolve(root, "src/injected/styles.css"),
  resolve(dist, "injected/styles.css")
);

console.log(`Built WispPatch into ${dirname(resolve(dist, "cli/index.js"))}`);
