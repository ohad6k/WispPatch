import type { PageDesignDna, VisualPatchDocument } from "./visualPatch.js";

type Token = {
  name: string;
  value: string;
  role: string;
};

export type WispDesignSystem = {
  version: "wisp-design-system.v1";
  mode: "reusable-design-system-contract";
  name: string;
  goal: string;
  target: VisualPatchDocument["target"];
  source: {
    dnaCaptured: boolean;
    visibleAssets: number;
    frameworkHints: string[];
    risks: string[];
  };
  tokens: {
    colors: Token[];
    typography: Token[];
    spacing: Token[];
    radii: Token[];
    shadows: Token[];
  };
  assetPolicy: string[];
  componentPolicy: string[];
  antiSlopRules: string[];
  implementationRules: string[];
  agentUse: string[];
};

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

function tokenName(prefix: string, index: number, role?: string): string {
  const suffix = role ? `-${slug(role)}` : "";
  return `--wisp-${prefix}-${index + 1}${suffix}`;
}

function colorTokens(dna: PageDesignDna | undefined): Token[] {
  if (!dna) return [];
  return dna.tokens.colors.slice(0, 10).map((color, index) => ({
    name: tokenName("color", index, color.roles[0]),
    value: color.value,
    role: color.roles.join(", ") || "unknown"
  }));
}

function simpleTokens(
  prefix: string,
  items: Array<{ value: string; count: number }> | undefined,
  role: string,
  limit: number
): Token[] {
  return (items || []).slice(0, limit).map((item, index) => ({
    name: tokenName(prefix, index),
    value: item.value,
    role
  }));
}

function fontTokens(dna: PageDesignDna | undefined): Token[] {
  return (dna?.tokens.fonts || []).slice(0, 5).map((font, index) => ({
    name: tokenName("font", index),
    value: font.family,
    role: index === 0 ? "dominant body/display family" : "supporting family"
  }));
}

function dominantAssetPolicy(dna: PageDesignDna | undefined): string[] {
  if (!dna || dna.assets.length === 0) {
    return [
      "No visible assets were captured. Do not invent product screenshots, fake logos, fake avatars, or decorative SVG scenes.",
      "If the implementation needs imagery, use real assets from the repo or an honest placeholder and document the assumption in design-assets.md and design-gate.md."
    ];
  }

  return [
    "Prefer captured brand, product, and UI assets over generated decoration.",
    "Keep asset roles intact: brand marks stay brand marks, UI screenshots stay product proof, and content imagery should not become generic ornament.",
    ...dna.assets.slice(0, 5).map((asset) => `Captured ${asset.role} asset: ${asset.kind} ${asset.width}x${asset.height} ${asset.source || asset.alt || "source not recorded"}.`)
  ];
}

function componentPolicy(dna: PageDesignDna | undefined): string[] {
  const signals = dna?.componentSignals;
  const policy = [
    "Use existing app components and tokens before adding new styling primitives.",
    "Preserve hover, active, focus, disabled, loading, empty, and error states for changed controls.",
    "Use separators, rhythm, and hierarchy instead of adding extra cards when the page already has card-like structures."
  ];
  if (signals?.forms || signals?.inputs) {
    policy.push("Forms are present: labels stay above inputs, helper/error text stays below, and focus rings must remain visible.");
  }
  if (signals?.navs) {
    policy.push("Navigation is present: do not disturb current route structure, active states, or accessible labels.");
  }
  if (signals?.media) {
    policy.push("Media is present: preserve aspect ratios and alt/aria text when replacing or restyling assets.");
  }
  return policy;
}

export function createWispDesignSystem(patch: VisualPatchDocument): WispDesignSystem {
  const dna = patch.designDna;
  return {
    version: "wisp-design-system.v1",
    mode: "reusable-design-system-contract",
    name: `${slug(dna?.title || patch.target.label || "wisp")} design system`,
    goal: patch.goal,
    target: patch.target,
    source: {
      dnaCaptured: Boolean(dna),
      visibleAssets: dna?.assets.length || 0,
      frameworkHints: dna?.frameworkHints || [],
      risks: dna?.risks || []
    },
    tokens: {
      colors: colorTokens(dna),
      typography: fontTokens(dna),
      spacing: simpleTokens("space", dna?.tokens.spacing, "spacing rhythm", 10),
      radii: simpleTokens("radius", dna?.tokens.radii, "corner radius", 8),
      shadows: simpleTokens("shadow", dna?.tokens.shadows, "elevation", 6)
    },
    assetPolicy: dominantAssetPolicy(dna),
    componentPolicy: componentPolicy(dna),
    antiSlopRules: [
      "No purple-blue AI gradients unless brand evidence explicitly supports them.",
      "No fake metrics, fake customer quotes, generic people names, or vague startup copy.",
      "No decorative blobs, generic SVG hero people, neon glows, or gratuitous glass effects.",
      "Do not add a new font family, color family, or card treatment unless the approved direction requires it and the evidence supports it.",
      "Large type must improve hierarchy; compact panels and controls use restrained type sizes."
    ],
    implementationRules: [
      "Treat this file as the reusable design contract derived from the current page capture.",
      "Use design-dna.md for raw evidence and this file for distilled implementation rules.",
      "If source tokens, DESIGN.md, or brand docs conflict with this file, inspect both and document the stronger evidence in design-gate.md.",
      "Translate Wisp temporary CSS into maintainable app code; do not paste injected selectors directly unless the target app is static HTML.",
      "After implementation, run desktop and mobile checks and keep text contrast at or above WCAG thresholds."
    ],
    agentUse: [
      "Load this before source edits the same way Open Design loads a DESIGN.md contract.",
      "Load design-assets.md beside this file before making logo, screenshot, product image, avatar, or illustration decisions.",
      "Use the tokens as evidence-backed defaults, not as a license to ignore stronger source-code tokens.",
      "Keep this design system attached to future Wisp iterations so the project improves instead of resetting to one-off taste."
    ]
  };
}

function bullet(items: string[], fallback = "None recorded."): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function tokenTable(tokens: Token[]): string {
  if (tokens.length === 0) return "| None recorded | | |";
  return tokens.map((token) => `| \`${token.name}\` | ${token.value} | ${token.role} |`).join("\n");
}

export function createWispDesignSystemMarkdown(patch: VisualPatchDocument): string {
  const system = createWispDesignSystem(patch);
  return `# Wisp Design System

Mode: reusable-design-system-contract

## Purpose

This is a reusable DESIGN.md-style contract distilled from the approved WispPatch session. Use it with design-dna.md, design-assets.md, after.png, and design-gate.md before implementing source UI changes.

## Goal

${system.goal}

## Target

- Label: ${system.target.label}
- Selector: \`${system.target.selector}\`
- Bounds: x=${Math.round(system.target.bounds.x)}, y=${Math.round(system.target.bounds.y)}, width=${Math.round(system.target.bounds.width)}, height=${Math.round(system.target.bounds.height)}

## Source Evidence

| Field | Value |
| --- | --- |
| DNA captured | ${system.source.dnaCaptured ? "yes" : "no"} |
| Visible assets | ${system.source.visibleAssets} |
| Framework hints | ${system.source.frameworkHints.join(", ") || "None recorded"} |

## Color Tokens

| Token | Value | Role |
| --- | --- | --- |
${tokenTable(system.tokens.colors)}

## Typography Tokens

| Token | Value | Role |
| --- | --- | --- |
${tokenTable(system.tokens.typography)}

## Spacing Tokens

| Token | Value | Role |
| --- | --- | --- |
${tokenTable(system.tokens.spacing)}

## Radius Tokens

| Token | Value | Role |
| --- | --- | --- |
${tokenTable(system.tokens.radii)}

## Shadow Tokens

| Token | Value | Role |
| --- | --- | --- |
${tokenTable(system.tokens.shadows)}

## Asset Policy

${bullet(system.assetPolicy)}

## Component Policy

${bullet(system.componentPolicy)}

## Anti-Slop Rules

${bullet(system.antiSlopRules)}

## Implementation Rules

${bullet(system.implementationRules)}

## Risks To Investigate

${bullet(system.source.risks)}

## How Agents Should Use This

${bullet(system.agentUse)}
`;
}
