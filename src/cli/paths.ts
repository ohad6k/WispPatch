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
  designDnaJson: string;
  designDnaMd: string;
  designAssetsJson: string;
  designAssetsMd: string;
  designSystemJson: string;
  designSystemMd: string;
  designIterationsJson: string;
  designIterationsMd: string;
  designDirectionsJson: string;
  designDirectionsMd: string;
  designCritiqueJson: string;
  designCritiqueMd: string;
  designVerificationJson: string;
  designVerificationMd: string;
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
    designDnaJson: resolve(latest, "design-dna.json"),
    designDnaMd: resolve(latest, "design-dna.md"),
    designAssetsJson: resolve(latest, "design-assets.json"),
    designAssetsMd: resolve(latest, "design-assets.md"),
    designSystemJson: resolve(latest, "design-system.json"),
    designSystemMd: resolve(latest, "design-system.md"),
    designIterationsJson: resolve(latest, "design-iterations.json"),
    designIterationsMd: resolve(latest, "design-iterations.md"),
    designDirectionsJson: resolve(latest, "design-directions.json"),
    designDirectionsMd: resolve(latest, "design-directions.md"),
    designCritiqueJson: resolve(latest, "design-critique.json"),
    designCritiqueMd: resolve(latest, "design-critique.md"),
    designVerificationJson: resolve(latest, "design-verification.json"),
    designVerificationMd: resolve(latest, "design-verification.md"),
    designGateJson: resolve(latest, "design-gate.json"),
    designGateMd: resolve(latest, "design-gate.md"),
    implementMd: resolve(latest, "implement.md"),
    reviewHtml: resolve(latest, "review.html")
  };
}
