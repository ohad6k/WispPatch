export type WispState =
  | "idle"
  | "targeting"
  | "listening"
  | "flying"
  | "scanning"
  | "patching"
  | "presenting"
  | "success";

export type TargetInfo = {
  label: string;
  selector: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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

export type PatchPayload = {
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  goal: string;
  recipe: string;
  target: TargetInfo;
  operations: VisualOperation[];
  analysis?: {
    before?: TargetDesignAnalysis;
    after?: TargetDesignAnalysis;
  };
};

export type WispPatchConfig = {
  bridgeUrl: string;
};
