import type { TargetDesignAnalysis, VisualPatchDocument } from "./visualPatch.js";

export type WispDesignDirection = {
  id: string;
  name: string;
  intent: string;
  whenToUse: string[];
  visualMoves: string[];
  implementationNotes: string[];
  antiSlopGuardrails: string[];
  critiqueFocus: string[];
};

export type WispDesignDirections = {
  version: "wisp-design-directions.v1";
  mode: "direction-map";
  goal: string;
  target: VisualPatchDocument["target"];
  selectedRecipe: string;
  assumptions: string[];
  directions: WispDesignDirection[];
  selectionRule: string;
};

function analysisFor(patch: VisualPatchDocument): TargetDesignAnalysis | undefined {
  return patch.analysis?.after || patch.analysis?.before;
}

function hasBroadTarget(patch: VisualPatchDocument): boolean {
  return patch.target.bounds.width >= 640 && patch.target.bounds.height >= 300;
}

function hasMedia(analysis: TargetDesignAnalysis | undefined): boolean {
  return Boolean(analysis && analysis.density.media > 0);
}

function hasControls(analysis: TargetDesignAnalysis | undefined): boolean {
  return Boolean(analysis && analysis.density.buttons + analysis.density.links + analysis.density.inputs > 0);
}

function hasRepeatedContent(analysis: TargetDesignAnalysis | undefined): boolean {
  return Boolean(analysis && analysis.density.cardLike + analysis.density.lists >= 3);
}

function compactTarget(patch: VisualPatchDocument): boolean {
  return patch.target.bounds.width < 480 || patch.target.bounds.height < 220;
}

function assumptionList(patch: VisualPatchDocument, analysis: TargetDesignAnalysis | undefined): string[] {
  const assumptions = [
    "The approved after.png remains the source of truth; these directions are implementation routes, not extra scope.",
    "If the target app has DESIGN.md, tokens, brand docs, or component APIs, those override inferred Wisp defaults.",
    "Use real target app assets when available; use honest placeholders instead of invented proof."
  ];

  if (!analysis) {
    assumptions.push("No target analysis was captured, so the implementing agent must inspect the DOM and source manually.");
  }
  if (compactTarget(patch)) {
    assumptions.push("The selected target is compact, so hierarchy and interaction states matter more than dramatic layout changes.");
  }
  if (hasBroadTarget(patch)) {
    assumptions.push("The selected target is large enough to support layout-level direction changes if the surrounding app allows them.");
  }
  if (hasMedia(analysis)) {
    assumptions.push("Media exists in the target, so asset-led composition should beat decorative generated imagery.");
  }
  return assumptions;
}

function productDirection(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined
): WispDesignDirection {
  return {
    id: "product-clarity",
    name: "Product Clarity",
    intent:
      "Make the approved change feel like a precise product surface: clear hierarchy, quiet grouping, and strong interaction states.",
    whenToUse: [
      "The target is part of a dashboard, app shell, form, pricing section, settings panel, or operational workflow.",
      "The approved screenshot mostly improves hierarchy, spacing, controls, or readability.",
      hasControls(analysis)
        ? "Controls are present, so the implementation must preserve focus, hover, active, disabled, and loading states."
        : "Controls are limited or absent, so prioritize hierarchy and scan speed."
    ],
    visualMoves: [
      "Use separators, spacing rhythm, and type weight before adding elevated cards.",
      "Constrain paragraphs to readable line lengths and keep button labels stable.",
      "Use one accent only where it marks the primary action or current state.",
      "Keep surfaces quiet: no decorative blobs, neon glows, fake glass, or arbitrary gradients."
    ],
    implementationNotes: [
      "Prefer existing components, tokens, and layout primitives.",
      "Translate Wisp temporary CSS into maintainable source styles.",
      "Do not rewrite data fetching, routing, auth, billing, or unrelated UI.",
      "Check mobile text fit and hit targets at 44px minimum."
    ],
    antiSlopGuardrails: [
      "No fake metrics or invented proof.",
      "No equal three-card row unless the source information structure already requires it.",
      "No generic AI purple-blue gradient treatment.",
      "No oversized hero typography inside compact panels."
    ],
    critiqueFocus: [
      "Can a user read the primary, secondary, and supporting content in order?",
      "Did controls keep accessible states?",
      "Did the implementation reduce ambiguity without adding decoration?",
      "Does it still look native to the app?"
    ]
  };
}

function editorialDirection(
  patch: VisualPatchDocument,
  analysis: TargetDesignAnalysis | undefined
): WispDesignDirection {
  return {
    id: "editorial-signature",
    name: "Editorial Signature",
    intent:
      "Use asymmetric composition, asset-led hierarchy, and deliberate negative space to make a broad target feel memorable.",
    whenToUse: [
      hasBroadTarget(patch)
        ? "The selected target is broad enough for layout-level moves."
        : "Use only in a reduced form because the selected target is compact.",
      hasMedia(analysis)
        ? "Media is already present, so lead with the real asset instead of inventing illustration."
        : "Use this only if the app already has trustworthy imagery or a strong typographic concept.",
      "The approved screenshot pushes beyond simple cleanup into a stronger visual point of view."
    ],
    visualMoves: [
      "Use asymmetric grid proportions instead of centered hero defaults.",
      "Pair a restrained surface with one strong type or spacing decision.",
      "Let real media, product UI, or brand assets carry the visual signal.",
      "Use editorial white space; do not fill gaps with filler stats, quotes, or icons."
    ],
    implementationNotes: [
      "Collapse high-variance layouts to one column below tablet widths.",
      "Use CSS Grid rather than flex percentage math.",
      "Keep motion to transform and opacity if adding entrance or hover details.",
      "Record any missing assets as blockers or placeholders in design-gate.md."
    ],
    antiSlopGuardrails: [
      "No stock-feeling hero illustration.",
      "No centered giant headline over a vague gradient.",
      "No decorative icon row.",
      "No fake testimonial or fake customer proof."
    ],
    critiqueFocus: [
      "Does the composition have a memorable but justified point of view?",
      "Does the hierarchy survive a mobile collapse?",
      "Are assets real and relevant?",
      "Is every dramatic move tied to the approved target?"
    ]
  };
}

function systemDirection(analysis: TargetDesignAnalysis | undefined): WispDesignDirection {
  return {
    id: "system-contract",
    name: "System Contract",
    intent:
      "Treat the patch as a design-system alignment problem: tokens, component conventions, density, and proof before style.",
    whenToUse: [
      "The repo has DESIGN.md, tokens, CSS variables, component docs, or an established UI library.",
      hasRepeatedContent(analysis)
        ? "Repeated content is present, so consistency and rhythm matter more than one-off styling."
        : "The target is isolated, so avoid creating new global conventions for a local patch.",
      "The approved screenshot looks like a refinement of existing product language."
    ],
    visualMoves: [
      "Use existing color, spacing, radius, typography, and shadow tokens first.",
      "Standardize repeated nodes through shared classes or component props.",
      "Use stateful variants instead of ad hoc CSS overrides.",
      "Prefer evidence from source files over visual guessing."
    ],
    implementationNotes: [
      "Search for DESIGN.md, token files, theme providers, component modules, and nearby examples before editing.",
      "Keep changed styles close to the owning component or token layer.",
      "Avoid introducing a new abstraction unless it removes real duplication.",
      "Update only the selected target's real source path unless the design system itself owns the change."
    ],
    antiSlopGuardrails: [
      "No random new palette.",
      "No standalone CSS island if the app already has tokens.",
      "No generic shadcn-style default surface without customization.",
      "No card spam to fake structure."
    ],
    critiqueFocus: [
      "Does the result respect the app's existing contract?",
      "Are repeated elements more consistent after the patch?",
      "Did the implementation avoid style drift?",
      "Can another engineer maintain the change?"
    ]
  };
}

export function createWispDesignDirections(patch: VisualPatchDocument): WispDesignDirections {
  const analysis = analysisFor(patch);
  return {
    version: "wisp-design-directions.v1",
    mode: "direction-map",
    goal: patch.goal,
    target: patch.target,
    selectedRecipe: patch.recipe,
    assumptions: assumptionList(patch, analysis),
    directions: [
      productDirection(patch, analysis),
      editorialDirection(patch, analysis),
      systemDirection(analysis)
    ],
    selectionRule:
      "Choose one direction before source edits. If the approved screenshot clearly implies a direction, name it and proceed. If not, implement the closest small variant or document why a variation pass is needed."
  };
}

function bullet(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderDirection(direction: WispDesignDirection): string {
  return `## ${direction.name}

ID: \`${direction.id}\`

${direction.intent}

### When To Use

${bullet(direction.whenToUse)}

### Visual Moves

${bullet(direction.visualMoves)}

### Implementation Notes

${bullet(direction.implementationNotes)}

### Anti-Slop Guardrails

${bullet(direction.antiSlopGuardrails)}

### Critique Focus

${bullet(direction.critiqueFocus)}
`;
}

export function createWispDesignDirectionsMarkdown(patch: VisualPatchDocument): string {
  const directions = createWispDesignDirections(patch);
  return `# Wisp Design Directions

Mode: direction-map

## Goal

${directions.goal}

## Target

- Label: ${directions.target.label}
- Selector: \`${directions.target.selector}\`
- Recipe: \`${directions.selectedRecipe}\`
- Bounds: x=${Math.round(directions.target.bounds.x)}, y=${Math.round(
    directions.target.bounds.y
  )}, width=${Math.round(directions.target.bounds.width)}, height=${Math.round(
    directions.target.bounds.height
  )}

## Assumptions

${bullet(directions.assumptions)}

## Selection Rule

${directions.selectionRule}

${directions.directions.map(renderDirection).join("\n")}
`;
}
