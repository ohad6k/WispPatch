import type {
  PageDesignDna,
  TargetDesignAnalysis,
  VisualPatchDocument
} from "./visualPatch.js";

export type AssetRegistryEntry = {
  id: string;
  kind: string;
  source: string;
  alt: string;
  role: string;
  width: number;
  height: number;
  provenance: "page-dna" | "target-before" | "target-after";
  quality: {
    status: "usable" | "partial" | "needs-source";
    score: number;
    reasons: string[];
  };
};

export type AssetNeed = {
  kind: "logo" | "product-image" | "ui-screenshot" | "content-image" | "none";
  priority: "required-when-branded" | "required-when-product-led" | "optional" | "not-needed";
  status: "captured" | "missing" | "not-applicable";
  reason: string;
};

export type WispAssetRegistry = {
  version: "wisp-asset-registry.v1";
  mode: "real-assets-first";
  goal: string;
  target: VisualPatchDocument["target"];
  summary: {
    capturedAssets: number;
    usableAssets: number;
    missingCriticalNeeds: number;
  };
  assets: AssetRegistryEntry[];
  needs: AssetNeed[];
  policy: string[];
  implementationRules: string[];
  agentUse: string[];
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function scoreAsset(asset: {
  source: string;
  alt: string;
  role: string;
  width: number;
  height: number;
}): AssetRegistryEntry["quality"] {
  const reasons: string[] = [];
  let score = 10;

  if (!asset.source) {
    score -= 5;
    reasons.push("No source URL or path was captured.");
  }
  if (!asset.alt) {
    score -= 1;
    reasons.push("No alt text was captured.");
  }
  if (asset.width <= 0 || asset.height <= 0) {
    score -= 2;
    reasons.push("No rendered dimensions were captured.");
  } else if (asset.width < 240 || asset.height < 160) {
    score -= 2;
    reasons.push("Rendered dimensions are small; do not treat this as hero imagery without checking the source.");
  }
  if (asset.role === "unknown") {
    score -= 1;
    reasons.push("Asset role is unknown and needs human classification before reuse.");
  }

  const finalScore = Math.max(0, score);
  return {
    status: finalScore >= 8 ? "usable" : finalScore >= 5 ? "partial" : "needs-source",
    score: finalScore,
    reasons: reasons.length ? reasons : ["Captured asset has enough source, role, and dimension evidence for cautious reuse."]
  };
}

function addAsset(
  entries: AssetRegistryEntry[],
  seen: Set<string>,
  raw: {
    kind: string;
    source: string;
    alt: string;
    role: string;
    width: number;
    height: number;
    provenance: AssetRegistryEntry["provenance"];
  }
): void {
  const key = `${raw.kind}|${raw.source}|${raw.alt}|${raw.width}x${raw.height}`;
  if (seen.has(key)) return;
  seen.add(key);
  const normalized = {
    kind: raw.kind || "unknown",
    source: raw.source || "",
    alt: raw.alt || "",
    role: raw.role || "unknown",
    width: Math.round(raw.width || 0),
    height: Math.round(raw.height || 0)
  };
  entries.push({
    id: `asset-${entries.length + 1}-${slug(normalized.role || normalized.kind) || "item"}`,
    ...normalized,
    provenance: raw.provenance,
    quality: scoreAsset(normalized)
  });
}

function addDnaAssets(entries: AssetRegistryEntry[], seen: Set<string>, dna?: PageDesignDna): void {
  for (const asset of dna?.assets || []) {
    addAsset(entries, seen, {
      kind: asset.kind,
      source: asset.source,
      alt: asset.alt,
      role: asset.role,
      width: asset.width,
      height: asset.height,
      provenance: "page-dna"
    });
  }
}

function addAnalysisAssets(
  entries: AssetRegistryEntry[],
  seen: Set<string>,
  analysis?: TargetDesignAnalysis,
  provenance: "target-before" | "target-after" = "target-before"
): void {
  for (const asset of analysis?.structure.media || []) {
    addAsset(entries, seen, {
      kind: asset.kind,
      source: asset.source,
      alt: asset.alt,
      role: asset.alt ? "target media" : "target media without alt",
      width: asset.width,
      height: asset.height,
      provenance
    });
  }
}

function hasRole(entries: AssetRegistryEntry[], pattern: RegExp): boolean {
  return entries.some((asset) => pattern.test(`${asset.role} ${asset.alt} ${asset.source}`));
}

function inferNeeds(patch: VisualPatchDocument, assets: AssetRegistryEntry[]): AssetNeed[] {
  const context = `${patch.goal} ${patch.target.label} ${patch.designDna?.title || ""}`.toLowerCase();
  const branded = /brand|logo|company|product|landing|marketing|hero|saas|app|site|website/.test(context);
  const productLed = /product|app|dashboard|screenshot|interface|ui|hero|landing|saas|tool/.test(context);
  const hasAnyAssets = assets.length > 0;

  return [
    {
      kind: "logo",
      priority: "required-when-branded",
      status: hasRole(assets, /logo|brand|mark/) ? "captured" : branded ? "missing" : "not-applicable",
      reason: branded
        ? "Branded or product-led work needs a real logo or explicit evidence that no logo should appear."
        : "The captured goal does not clearly require a logo."
    },
    {
      kind: "product-image",
      priority: "required-when-product-led",
      status: hasRole(assets, /product|hero|render|photo/) ? "captured" : productLed ? "missing" : "not-applicable",
      reason: productLed
        ? "Product-led design should use real product imagery or an honest placeholder instead of CSS/SVG invention."
        : "The captured goal does not clearly require product imagery."
    },
    {
      kind: "ui-screenshot",
      priority: "required-when-product-led",
      status: hasRole(assets, /screenshot|interface|ui|dashboard|screen/) ? "captured" : productLed ? "missing" : "not-applicable",
      reason: productLed
        ? "Digital-product design should use real UI screenshots when the UI is the subject."
        : "The captured goal does not clearly require UI screenshots."
    },
    {
      kind: hasAnyAssets ? "content-image" : "none",
      priority: "optional",
      status: hasAnyAssets ? "captured" : "not-applicable",
      reason: hasAnyAssets
        ? "Captured content imagery may be reused only when it carries product or content meaning."
        : "No imagery was captured; do not add decorative stock imagery to fill space."
    }
  ];
}

export function createWispAssetRegistry(patch: VisualPatchDocument): WispAssetRegistry {
  const assets: AssetRegistryEntry[] = [];
  const seen = new Set<string>();
  addDnaAssets(assets, seen, patch.designDna);
  addAnalysisAssets(assets, seen, patch.analysis?.before, "target-before");
  addAnalysisAssets(assets, seen, patch.analysis?.after, "target-after");

  const needs = inferNeeds(patch, assets);
  const missingCriticalNeeds = needs.filter(
    (need) => need.status === "missing" && need.priority !== "optional"
  ).length;

  return {
    version: "wisp-asset-registry.v1",
    mode: "real-assets-first",
    goal: patch.goal,
    target: patch.target,
    summary: {
      capturedAssets: assets.length,
      usableAssets: assets.filter((asset) => asset.quality.status === "usable").length,
      missingCriticalNeeds
    },
    assets,
    needs,
    policy: [
      "Use captured real assets first when they support the approved visual direction.",
      "Do not invent brand marks, product renders, UI screenshots, customer avatars, fake logos, or fake metrics.",
      "If a required asset is missing, use an honest placeholder, record it in design-gate.md, and keep the design composition strong without pretending the asset exists.",
      "Only add imagery when removing it would reduce product meaning; do not use decorative stock imagery to fill space.",
      "Preserve asset role and aspect ratio: a logo remains a logo, a screenshot remains product proof, and content imagery remains content."
    ],
    implementationRules: [
      "Read this file before implementing source UI changes that involve brand, product, screenshots, avatars, icons, or imagery.",
      "Treat assets with score below 8/10 as provisional; inspect the original source before using them prominently.",
      "When repo assets, DESIGN.md, or brand docs conflict with this capture, prefer the stronger source evidence and document the decision.",
      "If missing critical needs remain, do not compensate with SVG scenes, decorative blobs, fake glass, fake people, or generated-looking placeholders.",
      "Record every asset used or intentionally omitted in the final design-gate.md proof."
    ],
    agentUse: [
      "This is WispPatch's built-in version of the asset-first design loop: capture, classify, decide, implement, verify.",
      "Use it with design-dna.md for raw page evidence and design-system.md for reusable token/component rules.",
      "A clean asset registry should make future Wisp iterations more specific instead of resetting to generic visual language."
    ]
  };
}

function bullet(items: string[], fallback = "None recorded."): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function renderAsset(asset: AssetRegistryEntry): string {
  return `| ${asset.id} | ${asset.kind} | ${asset.role} | ${asset.width}x${asset.height} | ${asset.provenance} | ${asset.quality.score}/10 ${asset.quality.status} | ${asset.source || asset.alt || "source not recorded"} |`;
}

function renderNeed(need: AssetNeed): string {
  return `| ${need.kind} | ${need.priority} | ${need.status} | ${need.reason} |`;
}

export function createWispAssetRegistryMarkdown(patch: VisualPatchDocument): string {
  const registry = createWispAssetRegistry(patch);
  const weakAssets = registry.assets.filter((asset) => asset.quality.status !== "usable");
  return `# Wisp Asset Registry

Mode: real-assets-first

This file prevents WispPatch handoffs from silently inventing brand proof, product imagery, UI screenshots, avatars, or decorative filler.

## Goal

${registry.goal}

## Target

- Label: ${registry.target.label}
- Selector: \`${registry.target.selector}\`
- Bounds: x=${Math.round(registry.target.bounds.x)}, y=${Math.round(registry.target.bounds.y)}, width=${Math.round(registry.target.bounds.width)}, height=${Math.round(registry.target.bounds.height)}

## Summary

| Field | Value |
| --- | --- |
| Captured assets | ${registry.summary.capturedAssets} |
| Usable assets | ${registry.summary.usableAssets} |
| Missing critical needs | ${registry.summary.missingCriticalNeeds} |

## Asset Needs

| Need | Priority | Status | Reason |
| --- | --- | --- | --- |
${registry.needs.map(renderNeed).join("\n")}

## Captured Assets

| ID | Kind | Role | Size | Provenance | Quality | Source or label |
| --- | --- | --- | --- | --- | --- | --- |
${registry.assets.length ? registry.assets.map(renderAsset).join("\n") : "| None | | | | | | No visible assets were captured. |"}

## Assets That Need Source Review

${bullet(weakAssets.map((asset) => `${asset.id}: ${asset.quality.reasons.join(" ")}`))}

## Policy

${bullet(registry.policy)}

## Implementation Rules

${bullet(registry.implementationRules)}

## How Agents Should Use This

${bullet(registry.agentUse)}
`;
}
