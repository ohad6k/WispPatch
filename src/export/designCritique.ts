import type { PageDesignDna, TargetDesignAnalysis, VisualPatchDocument } from "./visualPatch.js";

export type CritiqueScore = {
  dimension: "Philosophy alignment" | "Visual hierarchy" | "Craft quality" | "Functionality" | "Originality";
  score: number;
  rationale: string;
  fixes: string[];
};

export type WispDesignCritique = {
  version: "wisp-design-critique.v1";
  mode: "automatic-preflight-critique";
  goal: string;
  target: VisualPatchDocument["target"];
  recipe: string;
  overallScore: number;
  pass: boolean;
  confidence: "low" | "medium" | "high";
  scores: CritiqueScore[];
  hardFails: string[];
  quickWins: string[];
  notes: string[];
};

type ScoreDraft = {
  score: number;
  rationale: string[];
  fixes: string[];
};

function clampScore(score: number): number {
  return Math.max(1, Math.min(10, score));
}

function activeAnalysis(patch: VisualPatchDocument): TargetDesignAnalysis | undefined {
  return patch.analysis?.after || patch.analysis?.before;
}

function hasRisk(analysis: TargetDesignAnalysis | undefined, pattern: RegExp): boolean {
  return Boolean(analysis?.risks.some((risk) => pattern.test(risk)));
}

function hasDnaRisk(dna: PageDesignDna | undefined, pattern: RegExp): boolean {
  return Boolean(dna?.risks.some((risk) => pattern.test(risk)));
}

function hasDetectedAiSignatureRisk(analysis: TargetDesignAnalysis | undefined): boolean {
  return hasRisk(analysis, /Generic filler copy|Possible purple-blue|Card-heavy/i);
}

function hasDetectedDnaAiSignatureRisk(dna: PageDesignDna | undefined): boolean {
  return hasDnaRisk(dna, /Generic filler copy|Purple-blue|Card-heavy|Generic font/i);
}

function hasDetectedFakeProofRisk(analysis: TargetDesignAnalysis | undefined): boolean {
  return hasRisk(analysis, /^Generic filler copy or fake proof may be present/i);
}

function usesCssValue(patch: VisualPatchDocument, pattern: RegExp): boolean {
  return patch.operations.some((operation) => {
    if (operation.type === "text_replace") return pattern.test(operation.text);
    return Object.values(operation.css).some((value) => pattern.test(value));
  });
}

function operationKeys(patch: VisualPatchDocument): string[] {
  return patch.operations.flatMap((operation) => {
    if (operation.type === "text_replace") return ["text"];
    return Object.keys(operation.css);
  });
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function scorePhilosophy(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): CritiqueScore {
  const draft: ScoreDraft = {
    score: 8,
    rationale: [`The patch has a named recipe: ${patch.recipe}.`],
    fixes: []
  };

  if (patch.recipe === "signature" || patch.recipe === "editorial" || patch.recipe === "system" || patch.recipe === "product") {
    draft.score += 1;
    draft.rationale.push("The recipe maps to a clear Wisp direction rather than a generic preset.");
  }
  if (analysis?.designSignals.length) {
    draft.score += 1;
    draft.rationale.push("Target analysis captured design signals that can justify the direction.");
  }
  if (dna?.designSignals.length) {
    draft.score += 1;
    draft.rationale.push("Page design DNA captured surrounding product signals for context.");
  }
  if (!analysis) {
    draft.score -= 2;
    draft.rationale.push("No target analysis was captured.");
    draft.fixes.push("Inspect the target manually and record stronger context in design-analysis.md.");
  }
  if (patch.recipe === "dark" && !/dark|night/i.test(patch.goal)) {
    draft.score -= 2;
    draft.rationale.push("A dark treatment without an explicit dark-mode goal can drift away from product context.");
    draft.fixes.push("Use dark mode only when the goal or brand contract supports it.");
  }
  if (hasRisk(analysis, /generic font|purple-blue|fake proof/i) || hasDnaRisk(dna, /Generic font|Purple-blue|fake proof/i)) {
    draft.score -= 1;
    draft.rationale.push("Analysis detected risks that may weaken the design philosophy.");
    draft.fixes.push("Resolve or explicitly justify every risk listed in design-analysis.md and design-dna.md.");
  }

  return {
    dimension: "Philosophy alignment",
    score: clampScore(draft.score),
    rationale: draft.rationale.join(" "),
    fixes: draft.fixes
  };
}

function scoreHierarchy(patch: VisualPatchDocument, analysis: TargetDesignAnalysis | undefined): CritiqueScore {
  const keys = operationKeys(patch);
  const draft: ScoreDraft = {
    score: 7,
    rationale: [],
    fixes: []
  };

  if (keys.some((key) => /fontSize|fontWeight|lineHeight|letterSpacing/.test(key))) {
    draft.score += 1;
    draft.rationale.push("Typography operations are present.");
  }
  if (keys.some((key) => /padding|gap|margin|gridTemplateColumns|display/.test(key))) {
    draft.score += 1;
    draft.rationale.push("Layout and spacing operations are present.");
  }
  if (analysis && analysis.density.headings > 0) {
    draft.score += 1;
    draft.rationale.push("Headings were detected, giving the implementation a real hierarchy anchor.");
  }
  if (analysis && analysis.summary.textLength > 900 && analysis.density.headings === 0) {
    draft.score -= 2;
    draft.rationale.push("Dense text without headings makes visual hierarchy harder to prove.");
    draft.fixes.push("Introduce or preserve clear heading/section hierarchy in source code.");
  }
  if (patch.target.bounds.width < 420 && usesCssValue(patch, /clamp\(56px|112px|10vw/)) {
    draft.score -= 2;
    draft.rationale.push("Large display sizing on a compact target risks cramped hierarchy.");
    draft.fixes.push("Use compact typography for small selected targets.");
  }

  if (draft.rationale.length === 0) {
    draft.rationale.push("Hierarchy evidence is limited in the operations and analysis.");
    draft.fixes.push("Compare before.png and after.png and document the intended reading order.");
  }

  return {
    dimension: "Visual hierarchy",
    score: clampScore(draft.score),
    rationale: draft.rationale.join(" "),
    fixes: draft.fixes
  };
}

function scoreCraft(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): CritiqueScore {
  const keys = operationKeys(patch);
  const draft: ScoreDraft = {
    score: 8,
    rationale: [],
    fixes: []
  };

  if (keys.some((key) => /padding|gap|borderRadius|boxShadow|border/.test(key))) {
    draft.score += 1;
    draft.rationale.push("Spacing and surface craft operations are present.");
  }
  if (usesCssValue(patch, /color-mix|oklch|clamp/)) {
    draft.score += 1;
    draft.rationale.push("Modern CSS is used for calibrated values.");
  }
  if (usesCssValue(patch, /purple|violet|indigo|#7c3aed|#6366f1/i)) {
    draft.score -= 2;
    draft.rationale.push("Potential AI-purple color usage was detected.");
    draft.fixes.push("Replace purple-blue treatment unless the target brand requires it.");
  }
  if (analysis && analysis.density.cardLike >= 3 && patch.recipe === "cards") {
    draft.score -= 1;
    draft.rationale.push("A card recipe on an already card-heavy target risks generic card spam.");
    draft.fixes.push("Use separators, asymmetry, or content rhythm instead of more containers.");
  }
  if (hasRisk(analysis, /Card-heavy|decorative blobs|generic font/i)) {
    draft.score -= 1;
    draft.rationale.push("Target analysis detected craft risks.");
    draft.fixes.push("Address the listed craft risks before claiming completion.");
  }
  if (hasDnaRisk(dna, /Many distinct color|Generic font|Card-heavy/i)) {
    draft.score -= 1;
    draft.rationale.push("Page design DNA detected system-level craft risks.");
    draft.fixes.push("Use design-dna.md to avoid adding more ad hoc color, type, or card treatments.");
  }
  if (draft.rationale.length === 0) {
    draft.rationale.push("Craft evidence is neutral.");
  }

  return {
    dimension: "Craft quality",
    score: clampScore(draft.score),
    rationale: draft.rationale.join(" "),
    fixes: draft.fixes
  };
}

function scoreFunctionality(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): CritiqueScore {
  const selectors = patch.operations.map((operation) => operation.selector).join(" ");
  const draft: ScoreDraft = {
    score: 8,
    rationale: [],
    fixes: []
  };

  if (analysis && analysis.density.buttons + analysis.density.links + analysis.density.inputs > 0) {
    if (/:hover|:active|focus|disabled|loading/.test(selectors)) {
      draft.score += 1;
      draft.rationale.push("Interaction-state selectors are present for a target with controls.");
    } else {
      draft.score -= 2;
      draft.rationale.push("Controls are present, but state treatment is not evident in the operations.");
      draft.fixes.push("Ensure hover, focus-visible, active, disabled, and loading states are handled in source.");
    }
  }
  if (patch.operations.length === 0) {
    draft.score -= 3;
    draft.rationale.push("No operations were captured.");
    draft.fixes.push("Capture or document the approved visual delta before implementation.");
  }
  if (patch.operations.length > 14) {
    draft.score -= 1;
    draft.rationale.push("A large operation set may indicate overfitting temporary CSS.");
    draft.fixes.push("Translate the approved intent into smaller source-level changes.");
  }
  if (analysis?.designSignals.some((signal) => /real media|Interactive controls|Repeated content/i.test(signal))) {
    draft.score += 1;
    draft.rationale.push("Functional target signals were captured for handoff.");
  }
  if (dna && dna.componentSignals.forms + dna.componentSignals.inputs > 0) {
    draft.rationale.push("Page DNA shows form-like UI exists; implementation should preserve state and accessibility conventions.");
  }
  if (draft.rationale.length === 0) {
    draft.rationale.push("Functionality evidence is limited but no hard issue was detected.");
  }

  return {
    dimension: "Functionality",
    score: clampScore(draft.score),
    rationale: draft.rationale.join(" "),
    fixes: draft.fixes
  };
}

function scoreOriginality(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): CritiqueScore {
  const draft: ScoreDraft = {
    score: 8,
    rationale: [],
    fixes: []
  };

  if (patch.recipe === "signature" || patch.recipe === "editorial") {
    draft.score += 1;
    draft.rationale.push("The selected recipe aims beyond generic cleanup.");
  }
  if (patch.recipe === "premium") {
    draft.score -= 2;
    draft.rationale.push("The old generic premium recipe name is not specific enough.");
    draft.fixes.push("Use Signature polish, Editorial layout, Product clarity, or a source-specific route.");
  }
  if (hasDetectedAiSignatureRisk(analysis) || hasDetectedDnaAiSignatureRisk(dna)) {
    draft.score -= 2;
    draft.rationale.push("Analysis detected common AI design signatures.");
    draft.fixes.push("Remove or justify every generic visual/content signal before handoff.");
  }
  if (dna?.assets.some((asset) => asset.role === "brand" || asset.role === "product")) {
    draft.score += 1;
    draft.rationale.push("Page DNA found brand or product assets that can make the result more specific.");
  }
  if (analysis && analysis.density.media > 0) {
    draft.score += 1;
    draft.rationale.push("Real media is available, which supports product-specific design.");
  }
  if (analysis && analysis.density.media === 0 && patch.target.bounds.width > 700 && /hero|landing|marketing/i.test(patch.goal)) {
    draft.score -= 1;
    draft.rationale.push("A broad marketing-like target without media can slide into generic composition.");
    draft.fixes.push("Use real assets or an honest placeholder rather than decorative filler.");
  }
  if (draft.rationale.length === 0) {
    draft.rationale.push("Originality evidence is neutral.");
  }

  return {
    dimension: "Originality",
    score: clampScore(draft.score),
    rationale: draft.rationale.join(" "),
    fixes: draft.fixes
  };
}

function hardFailsFor(
  scores: CritiqueScore[],
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): string[] {
  const hardFails: string[] = [];
  if (scores.some((score) => score.score < 6)) {
    hardFails.push("At least one critique dimension is below 6/10.");
  }
  if (hasDetectedFakeProofRisk(analysis) || hasDnaRisk(dna, /^Generic filler copy or fake proof/i)) {
    hardFails.push("Potential fake content/proof was detected.");
  }
  if (hasRisk(analysis, /purple-blue AI gradient/i) || hasDnaRisk(dna, /Purple-blue AI color/i)) {
    hardFails.push("Possible purple-blue AI gradient signal needs brand evidence.");
  }
  return hardFails;
}

function quickWinsFor(
  scores: CritiqueScore[],
  analysis: TargetDesignAnalysis | undefined,
  dna: PageDesignDna | undefined
): string[] {
  const fixes = unique(scores.flatMap((score) => score.fixes));
  if (fixes.length > 0) return fixes.slice(0, 5);

  const wins = [
    "Name the chosen design-directions.md route before source edits.",
    "Compare after.png against the source implementation at desktop and mobile widths.",
    "Record final rubric scores in design-gate.md."
  ];
  if (analysis?.risks.length) {
    wins.unshift("Resolve or justify every risk listed in design-analysis.md.");
  }
  if (dna?.risks.length) {
    wins.unshift("Resolve or justify every risk listed in design-dna.md.");
  }
  return wins.slice(0, 5);
}

export function createWispDesignCritique(patch: VisualPatchDocument): WispDesignCritique {
  const analysis = activeAnalysis(patch);
  const dna = patch.designDna;
  const scores = [
    scorePhilosophy(patch, analysis, dna),
    scoreHierarchy(patch, analysis),
    scoreCraft(patch, analysis, dna),
    scoreFunctionality(patch, analysis, dna),
    scoreOriginality(patch, analysis, dna)
  ];
  const overallScore =
    Math.round((scores.reduce((sum, score) => sum + score.score, 0) / scores.length) * 10) / 10;
  const hardFails = hardFailsFor(scores, analysis, dna);
  const pass = overallScore >= 8 && hardFails.length === 0 && scores.every((score) => score.score >= 8);

  return {
    version: "wisp-design-critique.v1",
    mode: "automatic-preflight-critique",
    goal: patch.goal,
    target: patch.target,
    recipe: patch.recipe,
    overallScore,
    pass,
    confidence: analysis ? "medium" : "low",
    scores,
    hardFails,
    quickWins: quickWinsFor(scores, analysis, dna),
    notes: [
      "This is a deterministic preflight critique from captured operations and target analysis.",
      "It does not replace human visual QA against before.png and after.png.",
      "Any score below 8/10 should trigger one focused iteration or a documented blocker."
    ]
  };
}

function bullet(items: string[], fallback = "None."): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function renderScore(score: CritiqueScore): string {
  return `| ${score.dimension} | ${score.score}/10 | ${score.rationale} | ${score.fixes.join("; ") || "No immediate fix recorded."} |`;
}

export function createWispDesignCritiqueMarkdown(patch: VisualPatchDocument): string {
  const critique = createWispDesignCritique(patch);
  return `# Wisp Design Critique

Mode: automatic-preflight-critique

## Result

- Overall score: ${critique.overallScore}/10
- Pass: ${critique.pass ? "yes" : "no"}
- Confidence: ${critique.confidence}
- Recipe: \`${critique.recipe}\`

## Target

- Label: ${critique.target.label}
- Selector: \`${critique.target.selector}\`
- Bounds: x=${Math.round(critique.target.bounds.x)}, y=${Math.round(
    critique.target.bounds.y
  )}, width=${Math.round(critique.target.bounds.width)}, height=${Math.round(
    critique.target.bounds.height
  )}

## Scores

| Dimension | Score | Rationale | Fixes |
| --- | --- | --- | --- |
${critique.scores.map(renderScore).join("\n")}

## Hard Fails

${bullet(critique.hardFails)}

## Quick Wins

${bullet(critique.quickWins)}

## Notes

${bullet(critique.notes)}
`;
}
