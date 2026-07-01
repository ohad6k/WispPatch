import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { startBridge } from "./bridge.js";
import { createOutputPaths } from "./paths.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function usage(): string {
  return `Usage: wisppatch <url>

Example:
  wisppatch http://127.0.0.1:4177
`;
}

function parseTargetUrl(argv: string[]): string {
  const raw = argv[2];
  if (!raw) {
    throw new Error(usage());
  }

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only http and https URLs are supported.");
    }
    return url.toString();
  } catch (error) {
    if (error instanceof Error && error.message === usage()) throw error;
    throw new Error(`Invalid URL: ${raw}\n\n${usage()}`);
  }
}

async function injectOverlay(page: Page, bridgeUrl: string): Promise<void> {
  const overlayJs = await readFile(resolve(root, "dist/injected/overlay.js"), "utf8");

  await page.addInitScript((config) => {
    (window as typeof window & { __WISPPATCH__?: unknown }).__WISPPATCH__ = config;
  }, { bridgeUrl });

  await page.evaluate((config) => {
    (window as typeof window & { __WISPPATCH__?: unknown }).__WISPPATCH__ = config;
  }, { bridgeUrl });

  await page.addScriptTag({ content: overlayJs });
}

async function main(): Promise<void> {
  const targetUrl = parseTargetUrl(process.argv);
  const paths = await createOutputPaths(process.cwd());

  const browser = await chromium.launch({
    headless: false
  });
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  const bridge = await startBridge({ page, paths });

  page.on("close", () => {
    void bridge.close().catch(() => undefined);
  });

  console.log(`WispPatch bridge: ${bridge.url}`);
  console.log(`Artifacts: ${paths.latest}`);
  console.log(`Opening ${targetUrl}`);

  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await injectOverlay(page, bridge.url);

  console.log("Wisp is live. Click a section in the browser to begin.");

  await new Promise<void>((resolve) => {
    browser.on("disconnected", () => resolve());
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
