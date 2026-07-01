import type { VisualPatchDocument } from "./visualPatch.js";

export type DesignGateCheck = {
  id: string;
  label: string;
  evidence: string;
};

export type DesignGateDimension = {
  name: string;
  minimumScore: number;
  scoreGuide: string;
};

export type WispDesignGate = {
  version: "wisp-design-gate.v1";
  mode: "top-tier-design-gate";
  target: VisualPatchDocument["target"];
  requiredChecks: DesignGateCheck[];
  rubric: DesignGateDimension[];
  hardFails: string[];
  requiredFinalProof: string[];
};

const requiredChecks: DesignGateCheck[] = [
  {
    id: "context-inventory",
    label: "Context inventory completed",
    evidence:
      "List repo design contracts, DESIGN.md, brand docs, tokens, component APIs, screenshots, design-analysis.md findings, and assets used. If missing, record the assumption."
  },
  {
    id: "target-analysis-used",
    label: "Target analysis used",
    evidence:
      "Read design-analysis.md and explain which structure, density, asset, typography, or risk signals shaped the implementation."
  },
  {
    id: "asset-first",
    label: "Real assets or honest placeholders used",
    evidence:
      "Do not invent brand marks, fake product screenshots, fake metrics, fake people, or fake quotes."
  },
  {
    id: "direction-lock",
    label: "Design direction locked before polish",
    evidence:
      "Choose one route from design-directions.md or explain why stronger source/screenshot evidence supersedes it."
  },
  {
    id: "variation-or-reason",
    label: "Variation step completed or intentionally skipped",
    evidence:
      "Use design-directions.md as the minimum direction map. If direction is still ambiguous, create 2-3 compact alternatives. If after.png is specific enough, state why no extra variation is needed."
  },
  {
    id: "anti-slop-scan",
    label: "AI-slop scan completed",
    evidence:
      "Check for generic card rows, purple-blue gradients, decorative blobs, neon glows, fake data, vague copy, and unrelated rewrites."
  },
  {
    id: "responsive-proof",
    label: "Desktop and mobile visual proof completed",
    evidence:
      "Inspect at least one desktop and one mobile viewport for overflow, text fit, hierarchy, and layout stability."
  },
  {
    id: "scope-proof",
    label: "Scope stayed inside the approved visual target",
    evidence:
      "No backend, auth, billing, data fetching, provider, routing, or unrelated UI rewrites."
  }
];

const rubric: DesignGateDimension[] = [
  {
    name: "Philosophy alignment",
    minimumScore: 8,
    scoreGuide: "The result has a named design direction and all major choices support it."
  },
  {
    name: "Visual hierarchy",
    minimumScore: 8,
    scoreGuide: "Primary, secondary, and supporting information read in the intended order."
  },
  {
    name: "Craft quality",
    minimumScore: 8,
    scoreGuide: "Spacing, alignment, type, color, and responsive behavior feel intentional."
  },
  {
    name: "Functionality",
    minimumScore: 8,
    scoreGuide: "The visual change helps the user outcome and preserves existing behavior."
  },
  {
    name: "Originality",
    minimumScore: 8,
    scoreGuide: "The result avoids common AI design signatures and feels product-specific."
  }
];

export function createWispDesignGate(patch: VisualPatchDocument): WispDesignGate {
  return {
    version: "wisp-design-gate.v1",
    mode: "top-tier-design-gate",
    target: patch.target,
    requiredChecks,
    rubric,
    hardFails: [
      "Any changed control has no visible hover/focus/active/disabled/loading/error consideration when relevant.",
      "The implementation uses fake metrics, fake quotes, fake people, or fake brand claims as decoration.",
      "The result introduces generic AI visual signatures without brand or product evidence.",
      "The result changes backend logic, auth, billing, provider configuration, routing, or data fetching.",
      "The implementation is not checked against both desktop and mobile viewports.",
      "Any rubric dimension is below 8/10 without a documented blocker and follow-up."
    ],
    requiredFinalProof: [
      "Context inventory",
      "Target analysis findings used",
      "Design direction sentence",
      "Chosen design-directions.md route or superseding evidence",
      "Variation decision",
      "Anti-slop scan result",
      "Rubric scores",
      "Desktop and mobile visual checks",
      "Verification command output",
      "Changed files"
    ]
  };
}

function checkbox(check: DesignGateCheck): string {
  return `- [ ] ${check.label}\n  Evidence: ${check.evidence}`;
}

function scoreRow(dimension: DesignGateDimension): string {
  return `| ${dimension.name} | /10 | ${dimension.minimumScore}/10 | ${dimension.scoreGuide} |`;
}

function bullet(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function createWispDesignGateMarkdown(patch: VisualPatchDocument): string {
  const gate = createWispDesignGate(patch);
  return `# Wisp Design Gate

Mode: top-tier-design-gate

This scorecard must be completed before a coding agent claims the approved WispPatch design has been implemented.

## Target

- Label: ${gate.target.label}
- Selector: \`${gate.target.selector}\`
- Bounds: x=${Math.round(gate.target.bounds.x)}, y=${Math.round(
    gate.target.bounds.y
  )}, width=${Math.round(gate.target.bounds.width)}, height=${Math.round(
    gate.target.bounds.height
  )}

## Required Checks

${gate.requiredChecks.map(checkbox).join("\n\n")}

## Rubric

Every dimension must score at least 8/10 unless a blocker is documented with evidence.

| Dimension | Score | Minimum | Guide |
| --- | --- | --- | --- |
${gate.rubric.map(scoreRow).join("\n")}

## Hard Fails

${bullet(gate.hardFails)}

## Required Final Proof

${bullet(gate.requiredFinalProof)}
`;
}
