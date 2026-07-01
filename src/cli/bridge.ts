import { createServer, type Server } from "node:http";
import { writeFile } from "node:fs/promises";
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
        const designBrief = createWispDesignBrief(patch);
        const designDirections = createWispDesignDirections(patch);
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
              designDirections: context.paths.designDirectionsMd,
              designDirectionsJson: context.paths.designDirectionsJson,
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
