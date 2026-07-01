import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export type OutputPaths = {
  root: string;
  latest: string;
  beforePng: string;
  afterPng: string;
  visualPatchJson: string;
  designBriefJson: string;
  designBriefMd: string;
  designAnalysisJson: string;
  designAnalysisMd: string;
  designDirectionsJson: string;
  designDirectionsMd: string;
  designCritiqueJson: string;
  designCritiqueMd: string;
  designGateJson: string;
  designGateMd: string;
  implementMd: string;
  reviewHtml: string;
};

export async function createOutputPaths(cwd = process.cwd()): Promise<OutputPaths> {
  const root = resolve(cwd, ".wisppatch");
  const latest = resolve(root, "latest");
  await mkdir(latest, { recursive: true });

  return {
    root,
    latest,
    beforePng: resolve(latest, "before.png"),
    afterPng: resolve(latest, "after.png"),
    visualPatchJson: resolve(latest, "visualpatch.json"),
    designBriefJson: resolve(latest, "design-brief.json"),
    designBriefMd: resolve(latest, "design-brief.md"),
    designAnalysisJson: resolve(latest, "design-analysis.json"),
    designAnalysisMd: resolve(latest, "design-analysis.md"),
    designDirectionsJson: resolve(latest, "design-directions.json"),
    designDirectionsMd: resolve(latest, "design-directions.md"),
    designCritiqueJson: resolve(latest, "design-critique.json"),
    designCritiqueMd: resolve(latest, "design-critique.md"),
    designGateJson: resolve(latest, "design-gate.json"),
    designGateMd: resolve(latest, "design-gate.md"),
    implementMd: resolve(latest, "implement.md"),
    reviewHtml: resolve(latest, "review.html")
  };
}
