import { createServer, type Server } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import type { Page } from "playwright";
import {
  createWispDesignAnalysis,
  createWispDesignAnalysisMarkdown
} from "../export/designAnalysis.js";
import {
  createWispDesignBrief,
  createWispDesignBriefMarkdown
} from "../export/designBrief.js";
import {
  createWispDesignDirections,
  createWispDesignDirectionsMarkdown
} from "../export/designDirections.js";
import {
  createWispDesignDna,
  createWispDesignDnaMarkdown
} from "../export/designDna.js";
import {
  createWispAssetRegistry,
  createWispAssetRegistryMarkdown
} from "../export/designAssets.js";
import {
  createWispDesignSystem,
  createWispDesignSystemMarkdown
} from "../export/designSystem.js";
import {
  createWispDesignIterations,
  createWispDesignIterationsMarkdown
} from "../export/designIterations.js";
import {
  createWispDesignCritique,
  createWispDesignCritiqueMarkdown
} from "../export/designCritique.js";
import {
  createWispDesignVerification,
  createWispDesignVerificationMarkdown,
  type RuntimeEvidence,
  type ScreenshotEvidence,
  type WispDesignVerificationEvidence
} from "../export/designVerification.js";
import {
  createWispDesignGate,
  createWispDesignGateMarkdown
} from "../export/designGate.js";
import { createImplementationPrompt } from "../export/implementationPrompt.js";
import { createReviewHtml } from "../export/reviewHtml.js";
import {
  createVisualPatchDocument,
  type VisualPatchPayload
} from "../export/visualPatch.js";
import type { OutputPaths } from "./paths.js";

type BridgeContext = {
  page: Page;
  paths: OutputPaths;
};

type BridgeServer = {
  server: Server;
  url: string;
  close: () => Promise<void>;
};

async function readJson(req: NodeJS.ReadableStream): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body.length > 0 ? JSON.parse(body) : {};
}

async function capturePage(page: Page, path: string): Promise<void> {
  await page.evaluate(() => {
    const host = document.getElementById("wisppatch-root");
    if (host) host.style.setProperty("display", "none", "important");
  });
  await page.screenshot({ path, fullPage: true });
  await page.evaluate(() => {
    const host = document.getElementById("wisppatch-root");
    if (host) host.style.removeProperty("display");
  });
}

async function pngEvidence(path: string): Promise<ScreenshotEvidence> {
  try {
    const body = await readFile(path);
    const validPng =
      body.length >= 24 &&
      body[0] === 0x89 &&
      body[1] === 0x50 &&
      body[2] === 0x4e &&
      body[3] === 0x47;
    return {
      path,
      exists: true,
      bytes: body.length,
      width: validPng ? body.readUInt32BE(16) : 0,
      height: validPng ? body.readUInt32BE(20) : 0,
      validPng
    };
  } catch {
    return {
      path,
      exists: false,
      bytes: 0,
      width: 0,
      height: 0,
      validPng: false
    };
  }
}

async function collectRuntimeEvidence(page: Page, selector: string, label?: string): Promise<RuntimeEvidence> {
  const evidence = await page.evaluate((targetSelector) => {
    type Rgba = { r: number; g: number; b: number; a: number };

    function clamp(value: number, min = 0, max = 1): number {
      return Math.max(min, Math.min(max, value));
    }

    function parseRgbChannel(value: string): number {
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) return clamp(Number.parseFloat(trimmed) / 100) * 255;
      return Number.parseFloat(trimmed);
    }

    function parseAlpha(value: string | undefined): number {
      if (!value) return 1;
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) return clamp(Number.parseFloat(trimmed) / 100);
      return clamp(Number.parseFloat(trimmed));
    }

    function oklchToRgb(lightness: number, chroma: number, hue: number): Rgba {
      const hueRadians = (hue * Math.PI) / 180;
      const a = chroma * Math.cos(hueRadians);
      const b = chroma * Math.sin(hueRadians);
      const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
      const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
      const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
      const l = lPrime * lPrime * lPrime;
      const m = mPrime * mPrime * mPrime;
      const s = sPrime * sPrime * sPrime;
      const linearR = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      const linearG = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const linearB = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
      const encode = (channel: number) =>
        clamp(channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055) * 255;
      return { r: encode(linearR), g: encode(linearG), b: encode(linearB), a: 1 };
    }

    function parseColor(value: string): Rgba | null {
      const normalized = value.trim().toLowerCase();
      if (!normalized || normalized === "transparent" || normalized === "currentcolor") return null;

      const rgbMatch = normalized.match(/^rgba?\((.+)\)$/);
      if (rgbMatch) {
        const raw = rgbMatch[1].replace(/\s*\/\s*/, " ").replace(/,/g, " ");
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          return {
            r: parseRgbChannel(parts[0]),
            g: parseRgbChannel(parts[1]),
            b: parseRgbChannel(parts[2]),
            a: parseAlpha(parts[3])
          };
        }
      }

      const hexMatch = normalized.match(/^#([0-9a-f]{3,8})$/i);
      if (hexMatch) {
        const raw = hexMatch[1];
        const full =
          raw.length === 3 || raw.length === 4
            ? raw
                .split("")
                .map((part) => `${part}${part}`)
                .join("")
            : raw;
        const r = Number.parseInt(full.slice(0, 2), 16);
        const g = Number.parseInt(full.slice(2, 4), 16);
        const b = Number.parseInt(full.slice(4, 6), 16);
        const a = full.length >= 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;
        return { r, g, b, a };
      }

      const oklchMatch = normalized.match(/^oklch\((.+)\)$/);
      if (oklchMatch) {
        const parts = oklchMatch[1].replace(/\s*\/\s*/, " ").split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          const lightness = parts[0].endsWith("%") ? Number.parseFloat(parts[0]) / 100 : Number.parseFloat(parts[0]);
          const chroma = Number.parseFloat(parts[1]);
          const hue = parts[2] === "none" ? 0 : Number.parseFloat(parts[2]);
          const color = oklchToRgb(lightness, chroma, Number.isFinite(hue) ? hue : 0);
          color.a = parseAlpha(parts[3]);
          return color;
        }
      }

      return null;
    }

    function composite(foreground: Rgba, background: Rgba): Rgba {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha
      };
    }

    function relativeLuminance(color: Rgba): number {
      const channel = (value: number) => {
        const srgb = clamp(value / 255);
        return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    }

    function contrastRatio(foreground: Rgba, background: Rgba): number {
      const fg = composite(foreground, background);
      const light = Math.max(relativeLuminance(fg), relativeLuminance(background));
      const dark = Math.min(relativeLuminance(fg), relativeLuminance(background));
      return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
    }

    function effectiveBackground(element: Element): { value: string; color: Rgba } {
      let current: Element | null = element;
      while (current) {
        const value = window.getComputedStyle(current).backgroundColor;
        const color = parseColor(value);
        if (color && color.a > 0.02) return { value, color: composite(color, { r: 255, g: 255, b: 255, a: 1 }) };
        current = current.parentElement;
      }
      return { value: "rgb(255, 255, 255)", color: { r: 255, g: 255, b: 255, a: 1 } };
    }

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }

    function sampledSelector(element: Element): string {
      const id = element.id ? `#${CSS.escape(element.id)}` : "";
      const tag = element.tagName.toLowerCase();
      if (id) return `${tag}${id}`;
      const parent = element.parentElement;
      if (!parent) return tag;
      const index = Array.from(parent.children).indexOf(element) + 1;
      return `${tag}:nth-child(${index})`;
    }

    function collectTextContrast(target: Element | null) {
      if (!target) {
        return {
          checked: 0,
          passing: false,
          minimumRatio: 0,
          requiredMinimum: 4.5,
          failures: []
        };
      }

      const candidates = [target, ...Array.from(target.querySelectorAll("h1,h2,h3,h4,p,a,button,li,span,[role='heading']"))]
        .filter((element, index, list) => list.indexOf(element) === index)
        .filter((element) => visible(element) && Boolean(element.textContent?.replace(/\s+/g, " ").trim()))
        .slice(0, 28);
      const failures: Array<{
        selector: string;
        text: string;
        color: string;
        background: string;
        fontSize: string;
        fontWeight: string;
        ratio: number;
        requiredRatio: number;
      }> = [];
      let checked = 0;
      let minimumRatio = Number.POSITIVE_INFINITY;
      let requiredMinimum = 4.5;

      for (const element of candidates) {
        const style = window.getComputedStyle(element);
        const foreground = parseColor(style.color);
        if (!foreground) continue;
        const background = effectiveBackground(element);
        const ratio = contrastRatio(foreground, background.color);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const requiredRatio = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
        checked += 1;
        minimumRatio = Math.min(minimumRatio, ratio);
        requiredMinimum = Math.min(requiredMinimum, requiredRatio);
        if (ratio < requiredRatio) {
          failures.push({
            selector: sampledSelector(element),
            text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 90) || "",
            color: style.color,
            background: background.value,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            ratio,
            requiredRatio
          });
        }
      }

      return {
        checked,
        passing: checked > 0 && failures.length === 0,
        minimumRatio: checked > 0 && Number.isFinite(minimumRatio) ? Math.round(minimumRatio * 100) / 100 : 0,
        requiredMinimum,
        failures: failures.slice(0, 8)
      };
    }

    const target = document.querySelector(targetSelector);
    const rect = target?.getBoundingClientRect();
    const style = target ? window.getComputedStyle(target) : null;
    const targetWidth = rect?.width || 0;
    const targetHeight = rect?.height || 0;
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    return {
      title: document.title,
      url: window.location.href,
      readyState: document.readyState,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      document: {
        width: documentWidth,
        height: document.documentElement.scrollHeight,
        horizontalOverflow: documentWidth > viewportWidth + 2
      },
      target: {
        exists: Boolean(target),
        visible: Boolean(
          target &&
            targetWidth > 0 &&
            targetHeight > 0 &&
            style &&
            style.display !== "none" &&
            style.visibility !== "hidden"
        ),
        textLength: target?.textContent?.replace(/\s+/g, " ").trim().length || 0,
        bounds: {
          x: rect?.x || 0,
          y: rect?.y || 0,
          width: targetWidth,
          height: targetHeight
        }
      },
      textContrast: collectTextContrast(target)
    };
  }, selector);
  return { ...evidence, label };
}

async function collectResponsiveEvidence(page: Page, selector: string): Promise<RuntimeEvidence[]> {
  const original = page.viewportSize();
  const viewports = [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile", width: 390, height: 844 }
  ];
  const results: RuntimeEvidence[] = [];

  try {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(180);
      results.push(await collectRuntimeEvidence(page, selector, viewport.label));
    }
  } finally {
    if (original) {
      await page.setViewportSize(original);
      await page.waitForTimeout(80);
    }
  }

  return results;
}

export async function startBridge(context: BridgeContext): Promise<BridgeServer> {
  let latestPayload: VisualPatchPayload | undefined;

  const server = createServer(async (req, res) => {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");

      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (req.method === "POST" && url.pathname === "/capture-before") {
        latestPayload = (await readJson(req)) as VisualPatchPayload;
        await capturePage(context.page, context.paths.beforePng);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, path: context.paths.beforePng }));
        return;
      }

      if (req.method === "POST" && url.pathname === "/export") {
        const incoming = (await readJson(req)) as VisualPatchPayload;
        const payload = incoming || latestPayload;
        if (!payload) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "No visual patch payload" }));
          return;
        }

        await capturePage(context.page, context.paths.afterPng);
        const patch = createVisualPatchDocument(payload);
        const designAnalysis = createWispDesignAnalysis(patch);
        const designDna = createWispDesignDna(patch);
        const designAssets = createWispAssetRegistry(patch);
        const designSystem = createWispDesignSystem(patch);
        const designIterations = createWispDesignIterations(patch);
        const designBrief = createWispDesignBrief(patch);
        const designDirections = createWispDesignDirections(patch);
        const designCritique = createWispDesignCritique(patch);
        const designVerificationEvidence: WispDesignVerificationEvidence = {
          before: await pngEvidence(context.paths.beforePng),
          after: await pngEvidence(context.paths.afterPng),
          runtime: await collectRuntimeEvidence(context.page, patch.target.selector, "export"),
          responsive: await collectResponsiveEvidence(context.page, patch.target.selector),
          critique: {
            overallScore: designCritique.overallScore,
            pass: designCritique.pass,
            hardFails: designCritique.hardFails,
            quickWins: designCritique.quickWins
          }
        };
        const designVerification = createWispDesignVerification(patch, designVerificationEvidence);
        const designGate = createWispDesignGate(patch);
        await writeFile(
          context.paths.visualPatchJson,
          `${JSON.stringify(patch, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designBriefJson,
          `${JSON.stringify(designBrief, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designBriefMd,
          createWispDesignBriefMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designAnalysisJson,
          `${JSON.stringify(designAnalysis, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designAnalysisMd,
          createWispDesignAnalysisMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designDnaJson,
          `${JSON.stringify(designDna, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designDnaMd,
          createWispDesignDnaMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designAssetsJson,
          `${JSON.stringify(designAssets, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designAssetsMd,
          createWispAssetRegistryMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designSystemJson,
          `${JSON.stringify(designSystem, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designSystemMd,
          createWispDesignSystemMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designIterationsJson,
          `${JSON.stringify(designIterations, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designIterationsMd,
          createWispDesignIterationsMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designDirectionsJson,
          `${JSON.stringify(designDirections, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designDirectionsMd,
          createWispDesignDirectionsMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designCritiqueJson,
          `${JSON.stringify(designCritique, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designCritiqueMd,
          createWispDesignCritiqueMarkdown(patch),
          "utf8"
        );
        await writeFile(
          context.paths.designVerificationJson,
          `${JSON.stringify(designVerification, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designVerificationMd,
          createWispDesignVerificationMarkdown(patch, designVerificationEvidence),
          "utf8"
        );
        await writeFile(
          context.paths.designGateJson,
          `${JSON.stringify(designGate, null, 2)}\n`,
          "utf8"
        );
        await writeFile(
          context.paths.designGateMd,
          createWispDesignGateMarkdown(patch),
          "utf8"
        );
        await writeFile(context.paths.implementMd, createImplementationPrompt(patch), "utf8");
        await writeFile(context.paths.reviewHtml, createReviewHtml(patch), "utf8");

        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            outputDir: context.paths.latest,
            files: {
              before: context.paths.beforePng,
              after: context.paths.afterPng,
              visualPatch: context.paths.visualPatchJson,
              designBrief: context.paths.designBriefMd,
              designBriefJson: context.paths.designBriefJson,
              designAnalysis: context.paths.designAnalysisMd,
              designAnalysisJson: context.paths.designAnalysisJson,
              designDna: context.paths.designDnaMd,
              designDnaJson: context.paths.designDnaJson,
              designAssets: context.paths.designAssetsMd,
              designAssetsJson: context.paths.designAssetsJson,
              designSystem: context.paths.designSystemMd,
              designSystemJson: context.paths.designSystemJson,
              designIterations: context.paths.designIterationsMd,
              designIterationsJson: context.paths.designIterationsJson,
              designDirections: context.paths.designDirectionsMd,
              designDirectionsJson: context.paths.designDirectionsJson,
              designCritique: context.paths.designCritiqueMd,
              designCritiqueJson: context.paths.designCritiqueJson,
              designVerification: context.paths.designVerificationMd,
              designVerificationJson: context.paths.designVerificationJson,
              designGate: context.paths.designGateMd,
              designGateJson: context.paths.designGateJson,
              implement: context.paths.implementMd,
              review: context.paths.reviewHtml
            }
          })
        );
        return;
      }

      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Not found" }));
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown bridge error"
        })
      );
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Bridge failed to bind to a local port.");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}
