import type { VisualPatchDocument } from "./visualPatch.js";

export type DesignBriefSection = {
  title: string;
  items: string[];
};

export type CritiqueDimension = {
  name: string;
  pass: string;
  fail: string;
};

export type WispDesignBrief = {
  version: "wisp-design-brief.v1";
  mode: "top-tier-design";
  goal: string;
  target: VisualPatchDocument["target"];
  sources: {
    before: string;
    after: string;
    visualPatch: string;
    designAnalysis: string;
    designDna: string;
    designAssets: string;
    designSystem: string;
    designIterations: string;
    designDirections: string;
    designCritique: string;
    designVerification: string;
    review: string;
    designWorkflow: string;
    assetDirectory: string;
  };
  workflow: DesignBriefSection[];
  skillStack: DesignBriefSection[];
  critiqueRubric: CritiqueDimension[];
  completionGates: string[];
  antiPatterns: string[];
};

const designTasteRules = [
  "Use a high-variance layout when the target is broad enough: asymmetric grids, editorial spacing, or intentional negative space.",
  "Use one intentional accent color and avoid default purple-blue AI gradients.",
  "Use typography with character; do not default to Inter for premium or creative work unless the app already requires it.",
  "Animate only transform and opacity; isolate expensive motion from parent layout work.",
  "Provide interaction states for changed controls: hover, active, disabled, loading, empty, and error when relevant."
];

const huashuRules = [
  "Start from existing context: screenshots, assets, component system, brand docs, and codebase evidence.",
  "When context is weak, state assumptions and produce a direction before polishing details.",
  "Classify real assets first: logos, product imagery, UI screenshots, and meaningful content images outrank invented visuals.",
  "Use real assets or honest placeholders; do not invent fake metrics, fake quotes, or fake brand proof.",
  "Iterate through direction, implementation, detail polish, and verification instead of jumping straight to final code.",
  "Score the result on philosophy alignment, visual hierarchy, craft quality, functionality, and originality."
];

const openDesignRules = [
  "Treat design quality as a file contract agents can read, not as hidden taste in a prompt.",
  "Look for DESIGN.md, style guides, tokens, component docs, and templates before changing UI.",
  "Use skills, design systems, and templates as separate inputs that can be versioned and reused.",
  "Keep asset decisions in readable files so future agents can reuse evidence instead of restarting from generic imagery.",
  "Preview and critique the artifact before handing it to the implementation agent."
];

export function createWispDesignBrief(patch: VisualPatchDocument): WispDesignBrief {
  return {
    version: "wisp-design-brief.v1",
    mode: "top-tier-design",
    goal: patch.goal,
    target: patch.target,
    sources: {
      before: ".wisppatch/latest/before.png",
      after: ".wisppatch/latest/after.png",
      visualPatch: ".wisppatch/latest/visualpatch.json",
      designAnalysis: ".wisppatch/latest/design-analysis.md",
      designDna: ".wisppatch/latest/design-dna.md",
      designAssets: ".wisppatch/latest/design-assets.md",
      designSystem: ".wisppatch/latest/design-system.md",
      designIterations: ".wisppatch/latest/design-iterations.md",
      designDirections: ".wisppatch/latest/design-directions.md",
      designCritique: ".wisppatch/latest/design-critique.md",
      designVerification: ".wisppatch/latest/design-verification.md",
      review: ".wisppatch/latest/review.html",
      designWorkflow: "docs/design-workflow.md",
      assetDirectory: "assets/"
    },
    workflow: [
      {
        title: "1. Evidence and assets",
        items: [
          "Open before.png and after.png before editing.",
          "Read visualpatch.json for goal, viewport, selector, bounds, recipe, operations, and acceptance criteria.",
          "Read design-analysis.md for the selected target's DOM structure, visible assets, typography, density, and risks.",
          "Read design-dna.md for page-level colors, typography, spacing, assets, component signals, and anti-slop risks.",
          "Read design-assets.md for captured real assets, missing logo/product/UI needs, quality scores, and placeholder requirements.",
          "Read design-system.md as the reusable DESIGN.md-style contract distilled from captured DNA.",
          "Read design-iterations.md for the Wisp loop history: routes tried, pushed, refined, undone, and accepted.",
          "Read design-directions.md for the target-aware direction map before deciding implementation strategy.",
          "Read design-critique.md for automatic preflight scores and quick wins.",
          "Read design-verification.md for automated browser proof: screenshot validity, target visibility, desktop/mobile overflow, context artifacts, and critique status.",
          "Search the target repo for DESIGN.md, brand docs, style guides, design tokens, component docs, and existing UI patterns.",
          "Use real brand/product/UI assets when available. If assets are missing, use honest placeholders and record the assumption."
        ]
      },
      {
        title: "2. Direction lock",
        items: [
          "Write the intended visual direction in one sentence before code changes.",
          "Use the accepted design-iterations.md pass as the chosen route when it exists.",
          "Choose one design-directions.md route or explain why the approved screenshot supersedes the suggested routes.",
          "Name the design system inputs being used: app tokens, Wisp assets, brand docs, or inferred defaults.",
          "Use design-system.md for the reusable token, asset, component, and anti-slop rules generated by Wisp.",
          "Use design-assets.md to avoid invented brand proof, fake screenshots, decorative stock imagery, or silent asset assumptions.",
          "Use design-dna.md to decide what to preserve from the surrounding page before adding any new visual language.",
          "If the approved screenshot is too weak to infer a direction, create two or three compact alternatives before polishing."
        ]
      },
      {
        title: "3. Source implementation",
        items: [
          "Implement the smallest real source change that matches after.png.",
          "Prefer existing components and tokens over new abstractions.",
          "Do not change backend logic, auth, billing, data fetching, routes, providers, or unrelated flows.",
          "Do not copy WispPatch temporary CSS blindly; translate the intent into maintainable app code."
        ]
      },
      {
        title: "4. Critique and iteration",
        items: [
          "Run the app and compare it to after.png.",
          "Resolve or explicitly supersede every design-critique.md quick win that applies to the source implementation.",
          "Score the result against the critique rubric in this brief.",
          "If any score is below 8 out of 10, do one focused design iteration or explain the blocker with evidence.",
          "Check at least one desktop viewport and one mobile viewport."
        ]
      }
    ],
    skillStack: [
      {
        title: "design-taste-frontend",
        items: designTasteRules
      },
      {
        title: "huashu-design",
        items: huashuRules
      },
      {
        title: "Open Design inspiration",
        items: openDesignRules
      }
    ],
    critiqueRubric: [
      {
        name: "Philosophy alignment",
        pass: "The design has a clear direction and every major choice supports it.",
        fail: "The design mixes random styles, decorative effects, or copied patterns without a coherent reason."
      },
      {
        name: "Visual hierarchy",
        pass: "A user can tell what to read first, second, and third without effort.",
        fail: "Everything has similar weight, spacing, color, or scale."
      },
      {
        name: "Craft quality",
        pass: "Spacing, alignment, color, typography, and responsive behavior feel intentional.",
        fail: "The UI has uneven spacing, unstable sizing, weak contrast, or cramped text."
      },
      {
        name: "Functionality",
        pass: "Every visual change supports the user outcome and preserves existing behavior.",
        fail: "Decoration competes with the product task or behavior changed outside the approved scope."
      },
      {
        name: "Originality",
        pass: "The result avoids common AI UI signatures and feels specific to this product.",
        fail: "The result looks like a generic landing page, dashboard template, or AI gradient demo."
      }
    ],
    completionGates: [
      "Design direction written before source edits.",
      "Design direction route chosen or explicitly superseded with evidence.",
      "Automatic design critique read and issues resolved, superseded, or documented.",
      "Automated design verification read and failures resolved or documented.",
      "Relevant design contract, tokens, assets, or assumptions recorded.",
      "Page-level design DNA read and either used or superseded with stronger source evidence.",
      "Asset registry read and missing real asset needs resolved, honestly placeholdered, or documented.",
      "Reusable design-system.md contract read and either used or superseded with stronger source evidence.",
      "Design iteration history read and accepted pass identified.",
      "Implementation visually matches after.png at the approved target.",
      "Desktop and mobile viewport checks completed.",
      "Critique rubric scored, with every dimension at least 8/10 or a documented blocker.",
      "Project verification command completed.",
      "Final diff stays scoped to the approved visual target."
    ],
    antiPatterns: [
      "Generic three-column feature rows.",
      "Purple-blue AI gradients used without brand evidence.",
      "Decorative blobs, neon glows, and fake glass effects.",
      "Fake metrics, fake quotes, fake people, or vague startup copy.",
      "SVG hero illustrations standing in for real product or brand assets.",
      "Oversized headings inside compact UI panels.",
      "Unrelated rewrites of app structure, routes, backend logic, auth, billing, or providers."
    ]
  };
}

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function createWispDesignBriefMarkdown(patch: VisualPatchDocument): string {
  const brief = createWispDesignBrief(patch);
  const workflow = brief.workflow
    .map((section) => `## ${section.title}\n\n${list(section.items)}`)
    .join("\n\n");
  const skillStack = brief.skillStack
    .map((section) => `### ${section.title}\n\n${list(section.items)}`)
    .join("\n\n");
  const rubric = brief.critiqueRubric
    .map(
      (dimension) =>
        `### ${dimension.name}\n\nPass: ${dimension.pass}\n\nFail: ${dimension.fail}`
    )
    .join("\n\n");

  return `# Wisp Design Brief

Mode: top-tier-design

## Goal

${brief.goal}

## Target

- Label: ${brief.target.label}
- Selector: \`${brief.target.selector}\`
- Bounds: x=${Math.round(brief.target.bounds.x)}, y=${Math.round(
    brief.target.bounds.y
  )}, width=${Math.round(brief.target.bounds.width)}, height=${Math.round(
    brief.target.bounds.height
  )}

## Required Sources

- Before screenshot: ${brief.sources.before}
- After screenshot: ${brief.sources.after}
- VisualPatch JSON: ${brief.sources.visualPatch}
- Design analysis: ${brief.sources.designAnalysis}
- Design DNA: ${brief.sources.designDna}
- Design assets: ${brief.sources.designAssets}
- Design system: ${brief.sources.designSystem}
- Design iterations: ${brief.sources.designIterations}
- Design directions: ${brief.sources.designDirections}
- Design critique: ${brief.sources.designCritique}
- Design verification: ${brief.sources.designVerification}
- Review page: ${brief.sources.review}
- Design workflow: ${brief.sources.designWorkflow}
- Asset directory: ${brief.sources.assetDirectory}

${workflow}

## Skill Stack

${skillStack}

## Critique Rubric

Score each dimension from 1 to 10 before claiming completion. Any score below 8 requires one focused design iteration or a documented blocker with evidence.

${rubric}

## Completion Gates

${list(brief.completionGates)}

## Anti-Patterns

${list(brief.antiPatterns)}
`;
}
