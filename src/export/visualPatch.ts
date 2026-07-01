export type VisualOperation =
  | {
      type: "css_rule";
      selector: string;
      css: Record<string, string>;
    }
  | {
      type: "inline_style";
      selector: string;
      css: Record<string, string>;
    }
  | {
      type: "text_replace";
      selector: string;
      text: string;
    };

export type TargetDesignAnalysis = {
  phase: "before" | "after";
  summary: {
    tagName: string;
    id: string;
    classNames: string[];
    role: string;
    ariaLabel: string;
    textSample: string;
    textLength: number;
    childCount: number;
  };
  density: {
    headings: number;
    links: number;
    buttons: number;
    inputs: number;
    media: number;
    lists: number;
    cardLike: number;
  };
  visual: {
    display: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    color: string;
    backgroundColor: string;
    backgroundImage: string;
    padding: string;
    gap: string;
    borderRadius: string;
    boxShadow: string;
  };
  structure: {
    headings: string[];
    controls: Array<{
      kind: string;
      text: string;
      role: string;
      ariaLabel: string;
      disabled: boolean;
    }>;
    media: Array<{
      kind: string;
      source: string;
      alt: string;
      width: number;
      height: number;
    }>;
  };
  designSignals: string[];
  risks: string[];
};

export type VisualPatchPayload = {
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  goal: string;
  recipe: string;
  target: {
    label: string;
    selector: string;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  operations: VisualOperation[];
  analysis?: {
    before?: TargetDesignAnalysis;
    after?: TargetDesignAnalysis;
  };
};

export type VisualPatchDocument = VisualPatchPayload & {
  version: "visualpatch.v1";
  tool: "wisppatch";
  createdAt: string;
  screenshots: {
    before: string;
    after: string;
  };
  artifacts: {
    designBrief: string;
    designBriefJson: string;
    designAnalysis: string;
    designAnalysisJson: string;
    designDirections: string;
    designDirectionsJson: string;
    designCritique: string;
    designCritiqueJson: string;
    designGate: string;
    designGateJson: string;
    implement: string;
    review: string;
  };
  acceptance: string[];
};

export function createVisualPatchDocument(
  payload: VisualPatchPayload
): VisualPatchDocument {
  return {
    version: "visualpatch.v1",
    tool: "wisppatch",
    createdAt: new Date().toISOString(),
    ...payload,
    screenshots: {
      before: ".wisppatch/latest/before.png",
      after: ".wisppatch/latest/after.png"
    },
    artifacts: {
      designBrief: ".wisppatch/latest/design-brief.md",
      designBriefJson: ".wisppatch/latest/design-brief.json",
      designAnalysis: ".wisppatch/latest/design-analysis.md",
      designAnalysisJson: ".wisppatch/latest/design-analysis.json",
      designDirections: ".wisppatch/latest/design-directions.md",
      designDirectionsJson: ".wisppatch/latest/design-directions.json",
      designCritique: ".wisppatch/latest/design-critique.md",
      designCritiqueJson: ".wisppatch/latest/design-critique.json",
      designGate: ".wisppatch/latest/design-gate.md",
      designGateJson: ".wisppatch/latest/design-gate.json",
      implement: ".wisppatch/latest/implement.md",
      review: ".wisppatch/latest/review.html"
    },
    acceptance: [
      "Match the approved after.png visual direction.",
      "Preserve routes, backend logic, data fetching, and existing user flows.",
      "Modify only the files needed to reproduce the approved visual target.",
      "Keep the page responsive across mobile and desktop widths.",
      "Avoid generic AI UI patterns; keep typography, spacing, color, and copy deliberate.",
      "Respect DESIGN.md, brand docs, design tokens, and component conventions when present.",
      "Use design-analysis.md to account for target structure, density, controls, assets, and risks.",
      "Use design-directions.md to choose or justify the implementation direction before source edits.",
      "Use design-critique.md to resolve preflight issues before handoff.",
      "Preserve or add appropriate interaction states for changed controls.",
      "Complete design-gate.md before claiming the implementation is done.",
      "Score the design brief rubric before handoff; every dimension should be at least 8/10 or have a documented blocker.",
      "Run the app and compare the implemented result against after.png."
    ]
  };
}
