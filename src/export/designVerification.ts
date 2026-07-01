import type { WispDesignCritique } from "./designCritique.js";
import type { VisualPatchDocument } from "./visualPatch.js";

export type ScreenshotEvidence = {
  path: string;
  exists: boolean;
  bytes: number;
  width: number;
  height: number;
  validPng: boolean;
};

export type RuntimeEvidence = {
  label?: string;
  title: string;
  url: string;
  readyState: string;
  viewport: {
    width: number;
    height: number;
  };
  document: {
    width: number;
    height: number;
    horizontalOverflow: boolean;
  };
  target: {
    exists: boolean;
    visible: boolean;
    textLength: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  textContrast: {
    checked: number;
    passing: boolean;
    minimumRatio: number;
    requiredMinimum: number;
    failures: Array<{
      selector: string;
      text: string;
      color: string;
      background: string;
      fontSize: string;
      fontWeight: string;
      ratio: number;
      requiredRatio: number;
    }>;
  };
};

export type VerificationCheck = {
  id: string;
  label: string;
  pass: boolean;
  evidence: string;
};

export type WispDesignVerificationEvidence = {
  before: ScreenshotEvidence;
  after: ScreenshotEvidence;
  runtime: RuntimeEvidence;
  responsive: RuntimeEvidence[];
  critique: Pick<WispDesignCritique, "overallScore" | "pass" | "hardFails" | "quickWins">;
};

export type WispDesignVerification = {
  version: "wisp-design-verification.v1";
  mode: "browser-artifact-verification";
  goal: string;
  target: VisualPatchDocument["target"];
  overallPass: boolean;
  checks: VerificationCheck[];
  evidence: WispDesignVerificationEvidence;
  agentUse: string[];
};

function check(id: string, label: string, pass: boolean, evidence: string): VerificationCheck {
  return { id, label, pass, evidence };
}

function screenshotEvidence(label: string, shot: ScreenshotEvidence): string {
  if (!shot.exists) return `${label} screenshot is missing at ${shot.path}.`;
  if (!shot.validPng) return `${label} screenshot exists but is not a valid PNG header.`;
  return `${label} screenshot is ${shot.width}x${shot.height}px, ${shot.bytes} bytes.`;
}

function responsiveEvidence(responsive: RuntimeEvidence[]): string {
  if (responsive.length === 0) return "No responsive viewport checks were recorded.";
  const failed = responsive.filter(
    (item) =>
      item.document.horizontalOverflow ||
      !item.target.exists ||
      !item.target.visible ||
      item.readyState === "loading"
  );
  if (failed.length === 0) {
    return `${responsive.length} viewport check(s) passed: ${responsive
      .map((item) => `${item.label || "viewport"} ${item.viewport.width}x${item.viewport.height}`)
      .join(", ")}.`;
  }
  return `${failed.length} viewport check(s) failed: ${failed
    .map((item) => `${item.label || "viewport"} overflow=${item.document.horizontalOverflow}, targetVisible=${item.target.visible}`)
    .join("; ")}.`;
}

function textContrastEvidence(evidence: RuntimeEvidence): string {
  if (evidence.textContrast.checked === 0) {
    return "No readable text samples were collected inside the approved target.";
  }
  if (evidence.textContrast.passing) {
    return `${evidence.textContrast.checked} text sample(s) passed; minimum contrast ${evidence.textContrast.minimumRatio}:1.`;
  }
  return `${evidence.textContrast.failures.length} text contrast issue(s); minimum contrast ${evidence.textContrast.minimumRatio}:1.`;
}

function responsiveContrastEvidence(responsive: RuntimeEvidence[]): string {
  if (responsive.length === 0) return "No responsive contrast checks were recorded.";
  const failed = responsive.filter((item) => !item.textContrast.passing || item.textContrast.checked === 0);
  if (failed.length === 0) {
    return `${responsive.length} viewport contrast check(s) passed: ${responsive
      .map((item) => `${item.label || "viewport"} min ${item.textContrast.minimumRatio}:1`)
      .join(", ")}.`;
  }
  return `${failed.length} viewport contrast check(s) failed: ${failed
    .map((item) => `${item.label || "viewport"} min ${item.textContrast.minimumRatio}:1`)
    .join("; ")}.`;
}

export function createWispDesignVerification(
  patch: VisualPatchDocument,
  evidence: WispDesignVerificationEvidence
): WispDesignVerification {
  const checks = [
    check(
      "before-screenshot",
      "Before screenshot captured",
      evidence.before.exists && evidence.before.validPng && evidence.before.bytes > 1024,
      screenshotEvidence("Before", evidence.before)
    ),
    check(
      "after-screenshot",
      "After screenshot captured",
      evidence.after.exists && evidence.after.validPng && evidence.after.bytes > 1024,
      screenshotEvidence("After", evidence.after)
    ),
    check(
      "runtime-ready",
      "Browser runtime was ready",
      evidence.runtime.readyState === "interactive" || evidence.runtime.readyState === "complete",
      `Document readyState was ${evidence.runtime.readyState}.`
    ),
    check(
      "target-visible",
      "Approved target visible after export",
      evidence.runtime.target.exists && evidence.runtime.target.visible,
      evidence.runtime.target.exists
        ? `Target bounds after export: x=${Math.round(evidence.runtime.target.bounds.x)}, y=${Math.round(
            evidence.runtime.target.bounds.y
          )}, width=${Math.round(evidence.runtime.target.bounds.width)}, height=${Math.round(
            evidence.runtime.target.bounds.height
          )}.`
        : "Target selector was not found after export."
    ),
    check(
      "no-horizontal-overflow",
      "No page-level horizontal overflow detected",
      !evidence.runtime.document.horizontalOverflow,
      `Document width ${evidence.runtime.document.width}px, viewport width ${evidence.runtime.viewport.width}px.`
    ),
    check(
      "target-text-contrast",
      "Approved target text contrast passed",
      evidence.runtime.textContrast.checked > 0 && evidence.runtime.textContrast.passing,
      textContrastEvidence(evidence.runtime)
    ),
    check(
      "responsive-viewports",
      "Desktop and mobile responsive checks passed",
      evidence.responsive.length >= 2 &&
        evidence.responsive.every(
          (item) =>
            !item.document.horizontalOverflow &&
            item.target.exists &&
            item.target.visible &&
            item.readyState !== "loading"
        ),
      responsiveEvidence(evidence.responsive)
    ),
    check(
      "responsive-text-contrast",
      "Desktop and mobile text contrast passed",
      evidence.responsive.length >= 2 &&
        evidence.responsive.every((item) => item.textContrast.checked > 0 && item.textContrast.passing),
      responsiveContrastEvidence(evidence.responsive)
    ),
    check(
      "target-analysis-present",
      "Target before/after analysis captured",
      Boolean(patch.analysis?.before && patch.analysis?.after),
      patch.analysis?.before && patch.analysis?.after
        ? "Both before and after target analysis are present."
        : "Target analysis is missing before or after context."
    ),
    check(
      "page-dna-present",
      "Page design DNA captured",
      Boolean(patch.designDna),
      patch.designDna
        ? `${patch.designDna.tokens.colors.length} color signals, ${patch.designDna.tokens.fonts.length} font signals, ${patch.designDna.assets.length} visible assets captured.`
        : "Page-level design DNA was not captured."
    ),
    check(
      "asset-registry-present",
      "Asset registry contract referenced",
      Boolean(patch.artifacts.designAssets && patch.artifacts.designAssetsJson),
      patch.artifacts.designAssets
        ? `Asset registry path: ${patch.artifacts.designAssets}.`
        : "Asset registry path was not recorded."
    ),
    check(
      "design-system-contract-present",
      "Reusable design system contract referenced",
      Boolean(patch.artifacts.designSystem && patch.artifacts.designSystemJson),
      patch.artifacts.designSystem
        ? `Design system contract path: ${patch.artifacts.designSystem}.`
        : "Design system contract path was not recorded."
    ),
    check(
      "iteration-history-present",
      "Accepted design iteration recorded",
      Boolean(patch.acceptedIterationId && patch.iterations?.some((iteration) => iteration.id === patch.acceptedIterationId)),
      patch.acceptedIterationId
        ? `Accepted iteration ${patch.acceptedIterationId} recorded across ${patch.iterations?.length || 0} iteration(s).`
        : "No accepted iteration was recorded."
    ),
    check(
      "critique-pass",
      "Automatic design critique passed",
      evidence.critique.pass,
      `Critique score ${evidence.critique.overallScore}/10, pass=${evidence.critique.pass}.`
    )
  ];

  return {
    version: "wisp-design-verification.v1",
    mode: "browser-artifact-verification",
    goal: patch.goal,
    target: patch.target,
    overallPass: checks.every((item) => item.pass),
    checks,
    evidence,
    agentUse: [
      "Use this file as the automated browser proof for the exported WispPatch artifact.",
      "A pass here does not replace human visual review, but a failure here must be resolved or documented before source implementation.",
      "Implementation agents should repeat desktop and mobile verification after applying the patch in the real source app.",
      "If screenshots, target visibility, asset registry, iteration history, design DNA, or critique evidence are missing, treat the handoff as incomplete."
    ]
  };
}

function bullet(items: string[], fallback = "None."): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function renderCheck(item: VerificationCheck): string {
  return `| ${item.label} | ${item.pass ? "yes" : "no"} | ${item.evidence} |`;
}

export function createWispDesignVerificationMarkdown(
  patch: VisualPatchDocument,
  evidence: WispDesignVerificationEvidence
): string {
  const verification = createWispDesignVerification(patch, evidence);
  return `# Wisp Design Verification

Mode: browser-artifact-verification

## Result

- Overall pass: ${verification.overallPass ? "yes" : "no"}
- Critique score: ${verification.evidence.critique.overallScore}/10
- Critique pass: ${verification.evidence.critique.pass ? "yes" : "no"}

## Target

- Label: ${verification.target.label}
- Selector: \`${verification.target.selector}\`
- Bounds: x=${Math.round(verification.target.bounds.x)}, y=${Math.round(
    verification.target.bounds.y
  )}, width=${Math.round(verification.target.bounds.width)}, height=${Math.round(
    verification.target.bounds.height
  )}

## Checks

| Check | Pass | Evidence |
| --- | --- | --- |
${verification.checks.map(renderCheck).join("\n")}

## Runtime Evidence

| Field | Value |
| --- | --- |
| Title | ${verification.evidence.runtime.title || "Not recorded"} |
| URL | ${verification.evidence.runtime.url} |
| Ready state | ${verification.evidence.runtime.readyState} |
| Viewport | ${verification.evidence.runtime.viewport.width}x${verification.evidence.runtime.viewport.height} |
| Document size | ${verification.evidence.runtime.document.width}x${verification.evidence.runtime.document.height} |
| Horizontal overflow | ${verification.evidence.runtime.document.horizontalOverflow ? "yes" : "no"} |
| Target visible | ${verification.evidence.runtime.target.visible ? "yes" : "no"} |
| Target text length | ${verification.evidence.runtime.target.textLength} |
| Text contrast | ${verification.evidence.runtime.textContrast.checked} checked, minimum ${verification.evidence.runtime.textContrast.minimumRatio}:1, pass=${verification.evidence.runtime.textContrast.passing ? "yes" : "no"} |

## Responsive Evidence

| Viewport | Ready | Document | Overflow | Target Visible | Text Contrast | Target Bounds |
| --- | --- | --- | --- | --- | --- | --- |
${verification.evidence.responsive
  .map(
    (item) =>
      `| ${item.label || "viewport"} ${item.viewport.width}x${item.viewport.height} | ${item.readyState} | ${item.document.width}x${item.document.height} | ${item.document.horizontalOverflow ? "yes" : "no"} | ${item.target.visible ? "yes" : "no"} | ${item.textContrast.checked} checked, min ${item.textContrast.minimumRatio}:1, pass=${item.textContrast.passing ? "yes" : "no"} | x=${Math.round(item.target.bounds.x)}, y=${Math.round(item.target.bounds.y)}, w=${Math.round(item.target.bounds.width)}, h=${Math.round(item.target.bounds.height)} |`
  )
  .join("\n")}

## Text Contrast Failures

| Selector | Ratio | Required | Text |
| --- | --- | --- | --- |
${verification.evidence.runtime.textContrast.failures.length
    ? verification.evidence.runtime.textContrast.failures
        .map(
          (item) =>
            `| \`${item.selector}\` | ${item.ratio}:1 | ${item.requiredRatio}:1 | ${item.text} |`
        )
        .join("\n")
    : "| None | | | |"}

## Screenshot Evidence

| Screenshot | Valid PNG | Size | Bytes | Path |
| --- | --- | --- | --- | --- |
| Before | ${verification.evidence.before.validPng ? "yes" : "no"} | ${verification.evidence.before.width}x${verification.evidence.before.height} | ${verification.evidence.before.bytes} | ${verification.evidence.before.path} |
| After | ${verification.evidence.after.validPng ? "yes" : "no"} | ${verification.evidence.after.width}x${verification.evidence.after.height} | ${verification.evidence.after.bytes} | ${verification.evidence.after.path} |

## Critique Follow-Up

Hard fails:

${bullet(verification.evidence.critique.hardFails)}

Quick wins:

${bullet(verification.evidence.critique.quickWins)}

## How Agents Should Use This

${bullet(verification.agentUse)}
`;
}
