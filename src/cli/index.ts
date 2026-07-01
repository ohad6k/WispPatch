import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { startBridge } from "./bridge.js";
import { createOutputPaths } from "./paths.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type CliMode =
  | {
      type: "launch";
      url: string;
    }
  | {
      type: "qa-demo";
    };

function usage(): string {
  return `Usage: wisppatch <url>
       wisppatch --qa-demo

Example:
  wisppatch http://127.0.0.1:4177
  wisppatch --qa-demo
`;
}

function parseArgs(argv: string[]): CliMode {
  const raw = argv[2];
  if (raw === "--qa-demo") {
    return { type: "qa-demo" };
  }
  if (!raw) {
    throw new Error(usage());
  }

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only http and https URLs are supported.");
    }
    return { type: "launch", url: url.toString() };
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

function contentTypeFor(pathname: string): string {
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  return "text/html; charset=utf-8";
}

async function startDemoServer(): Promise<{ server: Server; url: string; close: () => Promise<void> }> {
  const demoRoot = resolve(root, "demo");
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const filePath = resolve(demoRoot, `.${pathname}`);
      if (filePath !== demoRoot && !filePath.startsWith(`${demoRoot}${sep}`)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": contentTypeFor(pathname) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Demo server failed to bind to a local port.");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolveClose, reject) => {
        server.close((error) => (error ? reject(error) : resolveClose()));
      })
  };
}

async function launchInteractive(targetUrl: string): Promise<void> {
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

async function clickShadowButton(page: Page, selector: string): Promise<void> {
  await page.evaluate((buttonSelector) => {
    const root = document.getElementById("wisppatch-root")?.shadowRoot;
    const button = root?.querySelector<HTMLButtonElement>(buttonSelector);
    if (!button) {
      throw new Error(`WispPatch QA could not find ${buttonSelector}`);
    }
    button.click();
  }, selector);
}

async function waitForPanelMode(page: Page, mode: string): Promise<void> {
  await page.waitForFunction((expectedMode) => {
    const root = document.getElementById("wisppatch-root")?.shadowRoot;
    const panel = root?.querySelector<HTMLElement>(".wp-panel");
    return panel?.dataset.open === "true" && panel.dataset.mode === expectedMode;
  }, mode);
}

async function requiredArtifact(path: string): Promise<void> {
  await readFile(path);
}

async function runDemoQa(): Promise<void> {
  const paths = await createOutputPaths(process.cwd());
  const demo = await startDemoServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });
  const bridge = await startBridge({ page, paths });

  try {
    await page.goto(demo.url, { waitUntil: "domcontentloaded" });
    await injectOverlay(page, bridge.url);
    await page.waitForSelector("#wisppatch-root");

    const hero = await page.locator(".hero").boundingBox();
    if (!hero) {
      throw new Error("WispPatch QA could not find the demo hero target.");
    }

    const captureBefore = page.waitForResponse(
      (response) => response.url().includes("/capture-before") && response.request().method() === "POST"
    );
    await page.mouse.click(hero.x + hero.width / 2, hero.y + hero.height / 2);
    await captureBefore;
    await waitForPanelMode(page, "prompt");

    await clickShadowButton(page, ".wp-chip[data-goal='signature top-tier product direction']");
    await waitForPanelMode(page, "approval");

    await clickShadowButton(page, ".wp-action[data-action='retry']");
    await waitForPanelMode(page, "approval");

    await clickShadowButton(page, ".wp-action[data-action='push']");
    await waitForPanelMode(page, "approval");

    const exportResponse = page.waitForResponse(
      (response) => response.url().includes("/export") && response.request().method() === "POST"
    );
    await clickShadowButton(page, ".wp-action[data-action='export']");
    const response = await exportResponse;
    const json = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok() || !json.ok) {
      throw new Error(json.error || "WispPatch QA export failed.");
    }

    await Promise.all([
      requiredArtifact(paths.beforePng),
      requiredArtifact(paths.afterPng),
      requiredArtifact(paths.visualPatchJson),
      requiredArtifact(paths.designBriefMd),
      requiredArtifact(paths.designAnalysisMd),
      requiredArtifact(paths.designDnaJson),
      requiredArtifact(paths.designDnaMd),
      requiredArtifact(paths.designAssetsJson),
      requiredArtifact(paths.designAssetsMd),
      requiredArtifact(paths.designSystemJson),
      requiredArtifact(paths.designSystemMd),
      requiredArtifact(paths.designIterationsJson),
      requiredArtifact(paths.designIterationsMd),
      requiredArtifact(paths.designDirectionsMd),
      requiredArtifact(paths.designCritiqueMd),
      requiredArtifact(paths.designVerificationJson),
      requiredArtifact(paths.designVerificationMd),
      requiredArtifact(paths.designGateMd),
      requiredArtifact(paths.implementMd),
      requiredArtifact(paths.reviewHtml)
    ]);

    const critique = JSON.parse(await readFile(paths.designCritiqueJson, "utf8")) as {
      overallScore?: number;
      pass?: boolean;
    };
    const verification = JSON.parse(await readFile(paths.designVerificationJson, "utf8")) as {
      overallPass?: boolean;
      checks?: Array<{ label?: string; pass?: boolean }>;
    };
    if (!verification.overallPass) {
      const failed = verification.checks?.filter((check) => !check.pass).map((check) => check.label).join(", ");
      throw new Error(`WispPatch QA verification failed${failed ? `: ${failed}` : "."}`);
    }
    console.log(`WispPatch QA passed. Artifacts: ${paths.latest}`);
    console.log(`Design critique: ${critique.overallScore ?? "n/a"}/10, pass=${critique.pass === true}`);
  } finally {
    await bridge.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    await demo.close().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const mode = parseArgs(process.argv);
  if (mode.type === "qa-demo") {
    await runDemoQa();
    return;
  }

  await launchInteractive(mode.url);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
