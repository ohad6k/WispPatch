import type { PageDesignDna, VisualPatchDocument } from "./visualPatch.js";

export type WispDesignDna = {
  version: "wisp-design-dna.v1";
  mode: "page-design-system-capture";
  goal: string;
  target: VisualPatchDocument["target"];
  dna?: PageDesignDna;
  agentUse: string[];
};

export function createWispDesignDna(patch: VisualPatchDocument): WispDesignDna {
  return {
    version: "wisp-design-dna.v1",
    mode: "page-design-system-capture",
    goal: patch.goal,
    target: patch.target,
    dna: patch.designDna,
    agentUse: [
      "Use this file before styling decisions to understand the surrounding page's design system signals.",
      "Treat captured colors, fonts, spacing, radii, and assets as evidence, not as mandatory tokens.",
      "Prefer real visible brand, product, and UI assets over invented illustrations or decorative filler.",
      "When this capture conflicts with source-code tokens or DESIGN.md, inspect the source and record the stronger evidence in design-gate.md.",
      "Do not add new colors, font families, card treatments, fake metrics, or imagery unless the design direction requires them and the evidence supports it."
    ]
  };
}

function bullet(items: string[] | undefined, fallback = "None recorded."): string {
  if (!items || items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function tokenRows<T>(
  items: T[] | undefined,
  render: (item: T) => string,
  fallback = "| None recorded | | |"
): string {
  if (!items || items.length === 0) return fallback;
  return items.map(render).join("\n");
}

function renderDna(dna: PageDesignDna | undefined): string {
  if (!dna) {
    return "No page-level design DNA was captured. Inspect the app manually before making typography, color, asset, or component decisions.\n";
  }

  return `## Page Context

| Field | Value |
| --- | --- |
| Title | ${dna.title || "Not recorded"} |
| Language | ${dna.language || "Not recorded"} |
| Color scheme | ${dna.colorScheme || "Not recorded"} |

## Component Signals

| Signal | Count |
| --- | --- |
| Headings | ${dna.componentSignals.headings} |
| Links | ${dna.componentSignals.links} |
| Buttons | ${dna.componentSignals.buttons} |
| Inputs | ${dna.componentSignals.inputs} |
| Media | ${dna.componentSignals.media} |
| Navigation regions | ${dna.componentSignals.navs} |
| Forms | ${dna.componentSignals.forms} |
| Card-like nodes | ${dna.componentSignals.cards} |

## Token Signals

### Colors

| Value | Count | Roles |
| --- | --- | --- |
${tokenRows(
  dna.tokens.colors,
  (color) => `| ${color.value} | ${color.count} | ${color.roles.join(", ") || "unknown"} |`
)}

### Fonts

| Family | Count |
| --- | --- |
${tokenRows(dna.tokens.fonts, (font) => `| ${font.family} | ${font.count} |`, "| None recorded | |")}

### Spacing

| Value | Count |
| --- | --- |
${tokenRows(dna.tokens.spacing, (spacing) => `| ${spacing.value} | ${spacing.count} |`, "| None recorded | |")}

### Radii

| Value | Count |
| --- | --- |
${tokenRows(dna.tokens.radii, (radius) => `| ${radius.value} | ${radius.count} |`, "| None recorded | |")}

### Shadows

| Value | Count |
| --- | --- |
${tokenRows(dna.tokens.shadows, (shadow) => `| ${shadow.value} | ${shadow.count} |`, "| None recorded | |")}

## Visible Assets

| Kind | Role | Alt | Source | Size |
| --- | --- | --- | --- | --- |
${tokenRows(
  dna.assets,
  (asset) =>
    `| ${asset.kind} | ${asset.role} | ${asset.alt || "Not recorded"} | ${asset.source || "Not recorded"} | ${asset.width}x${asset.height} |`,
  "| None recorded | | | | |"
)}

## Framework Hints

${bullet(dna.frameworkHints)}

## Design Signals

${bullet(dna.designSignals)}

## Risks To Investigate

${bullet(dna.risks)}
`;
}

export function createWispDesignDnaMarkdown(patch: VisualPatchDocument): string {
  const designDna = createWispDesignDna(patch);
  return `# Wisp Design DNA

Mode: page-design-system-capture

## Goal

${designDna.goal}

## Target

- Label: ${designDna.target.label}
- Selector: \`${designDna.target.selector}\`
- Bounds: x=${Math.round(designDna.target.bounds.x)}, y=${Math.round(
    designDna.target.bounds.y
  )}, width=${Math.round(designDna.target.bounds.width)}, height=${Math.round(
    designDna.target.bounds.height
  )}

## How Agents Should Use This

${bullet(designDna.agentUse)}

${renderDna(designDna.dna)}
`;
}
