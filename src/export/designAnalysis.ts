import type { TargetDesignAnalysis, VisualPatchDocument } from "./visualPatch.js";

export type WispDesignAnalysis = {
  version: "wisp-design-analysis.v1";
  mode: "target-context-analysis";
  goal: string;
  target: VisualPatchDocument["target"];
  before?: TargetDesignAnalysis;
  after?: TargetDesignAnalysis;
  agentUse: string[];
};

export function createWispDesignAnalysis(patch: VisualPatchDocument): WispDesignAnalysis {
  return {
    version: "wisp-design-analysis.v1",
    mode: "target-context-analysis",
    goal: patch.goal,
    target: patch.target,
    before: patch.analysis?.before,
    after: patch.analysis?.after,
    agentUse: [
      "Use this file to understand the selected target before editing source code.",
      "Treat detected risks as prompts for investigation, not as automatic rewrite instructions.",
      "Prefer real app assets, tokens, and components over generic decorative replacements.",
      "Compare before and after analysis with before.png and after.png before deciding what to implement.",
      "If the analysis is missing or stale, inspect the app manually and record stronger evidence in design-gate.md."
    ]
  };
}

function bullet(items: string[] | undefined, fallback = "None recorded."): string {
  if (!items || items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function tableRow(label: string, value: string | number | undefined): string {
  return `| ${label} | ${value === undefined || value === "" ? "Not recorded" : value} |`;
}

function renderAnalysis(title: string, analysis: TargetDesignAnalysis | undefined): string {
  if (!analysis) {
    return `## ${title}\n\nNo ${title.toLowerCase()} target analysis was captured. Inspect the app manually before editing.\n`;
  }

  const density = analysis.density;
  const visual = analysis.visual;
  const summary = analysis.summary;
  const controls = analysis.structure.controls
    .map(
      (control) =>
        `- ${control.kind}: ${control.text || control.ariaLabel || control.role || "unlabeled"}${
          control.disabled ? " (disabled)" : ""
        }`
    )
    .join("\n");
  const media = analysis.structure.media
    .map(
      (item) =>
        `- ${item.kind}: ${item.alt || item.source || "no source"} (${item.width}x${item.height})`
    )
    .join("\n");

  return `## ${title}

### Summary

| Field | Value |
| --- | --- |
${[
  tableRow("Tag", summary.tagName),
  tableRow("ID", summary.id),
  tableRow("Classes", summary.classNames.join(", ")),
  tableRow("Role", summary.role),
  tableRow("ARIA label", summary.ariaLabel),
  tableRow("Text length", summary.textLength),
  tableRow("Child count", summary.childCount),
  tableRow("Text sample", summary.textSample)
].join("\n")}

### Density

| Signal | Count |
| --- | --- |
${[
  tableRow("Headings", density.headings),
  tableRow("Links", density.links),
  tableRow("Buttons", density.buttons),
  tableRow("Inputs", density.inputs),
  tableRow("Media", density.media),
  tableRow("Lists or tables", density.lists),
  tableRow("Card-like nodes", density.cardLike)
].join("\n")}

### Visual Snapshot

| Property | Value |
| --- | --- |
${[
  tableRow("Display", visual.display),
  tableRow("Font family", visual.fontFamily),
  tableRow("Font size", visual.fontSize),
  tableRow("Font weight", visual.fontWeight),
  tableRow("Line height", visual.lineHeight),
  tableRow("Color", visual.color),
  tableRow("Background color", visual.backgroundColor),
  tableRow("Background image", visual.backgroundImage),
  tableRow("Padding", visual.padding),
  tableRow("Gap", visual.gap),
  tableRow("Border radius", visual.borderRadius),
  tableRow("Box shadow", visual.boxShadow)
].join("\n")}

### Headings

${bullet(analysis.structure.headings)}

### Controls

${controls || "- None recorded."}

### Media

${media || "- None recorded."}

### Design Signals

${bullet(analysis.designSignals)}

### Risks To Investigate

${bullet(analysis.risks)}
`;
}

export function createWispDesignAnalysisMarkdown(patch: VisualPatchDocument): string {
  const analysis = createWispDesignAnalysis(patch);
  return `# Wisp Design Analysis

Mode: target-context-analysis

## Goal

${analysis.goal}

## Target

- Label: ${analysis.target.label}
- Selector: \`${analysis.target.selector}\`
- Bounds: x=${Math.round(analysis.target.bounds.x)}, y=${Math.round(
    analysis.target.bounds.y
  )}, width=${Math.round(analysis.target.bounds.width)}, height=${Math.round(
    analysis.target.bounds.height
  )}

## How Agents Should Use This

${bullet(analysis.agentUse)}

${renderAnalysis("Before Analysis", analysis.before)}

${renderAnalysis("After Analysis", analysis.after)}
`;
}
