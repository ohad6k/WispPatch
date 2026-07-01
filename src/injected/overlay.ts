import { applyOperations, clearOperations, createRecipe } from "./mutations";
import { createTargetPicker } from "./targetPicker";
import type {
  DesignIteration,
  PageDesignDna,
  PatchPayload,
  TargetDesignAnalysis,
  TargetInfo,
  VisualOperation,
  WispPatchConfig,
  WispState
} from "./types";
import { createWispSprite } from "./wispSvg";

declare const WISPPATCH_CSS: string;

declare global {
  interface Window {
    __WISPPATCH__?: WispPatchConfig;
  }
}

type RuntimeState = {
  wispState: WispState;
  target: TargetInfo | null;
  beforeAnalysis: TargetDesignAnalysis | null;
  goal: string;
  recipe: string;
  operations: VisualOperation[];
  pushCount: number;
  retryCount: number;
  nextIterationId: number;
  activeIterationId: number | null;
  iterations: DesignIteration[];
};

type PanelMode = "prompt" | "working" | "approval";
type WispGaze = "target" | "user" | "flight";

const config = window.__WISPPATCH__;
const state: RuntimeState = {
  wispState: "idle",
  target: null,
  beforeAnalysis: null,
  goal: "",
  recipe: "signature",
  operations: [],
  pushCount: 0,
  retryCount: 0,
  nextIterationId: 1,
  activeIterationId: null,
  iterations: []
};

function setText(element: Element | null, value: string): void {
  if (element) element.textContent = value;
}

function cleanText(value: string | null | undefined, max = 140): string {
  const text = (value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function classNamesFor(element: Element): string[] {
  return Array.from(element.classList).slice(0, 12);
}

function assetSourceFor(element: Element): string {
  if (element instanceof HTMLImageElement) return element.currentSrc || element.src || "";
  if (element instanceof HTMLVideoElement) return element.currentSrc || element.src || "";
  if (element instanceof HTMLSourceElement) return element.src || "";
  return "";
}

function mediaSizeFor(element: Element): { width: number; height: number } {
  if (element instanceof HTMLImageElement) {
    return {
      width: element.naturalWidth || element.width || 0,
      height: element.naturalHeight || element.height || 0
    };
  }
  if (element instanceof HTMLVideoElement) {
    return {
      width: element.videoWidth || element.clientWidth || 0,
      height: element.videoHeight || element.clientHeight || 0
    };
  }
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    const rect = element.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  }
  return { width: 0, height: 0 };
}

function buildDesignSignals(
  target: TargetInfo,
  element: Element,
  density: TargetDesignAnalysis["density"]
): string[] {
  const signals: string[] = [];
  if (target.bounds.width > 640 && target.bounds.height > 340) {
    signals.push("Broad target: supports asymmetric layout, editorial spacing, or stronger hierarchy.");
  }
  if (density.media > 0) {
    signals.push("Real media is present; prefer asset-led composition over decorative SVG imagery.");
  }
  if (density.buttons + density.links > 0) {
    signals.push("Interactive controls are present; preserve hover, focus, active, disabled, and loading states when relevant.");
  }
  if (density.lists > 0 || density.cardLike > 0) {
    signals.push("Repeated content is present; use rhythm, separators, or asymmetric sizing instead of generic equal cards.");
  }
  if (element.querySelector("[data-theme], [class*='theme'], [class*='token']")) {
    signals.push("Theme or token hints are present in the DOM; inspect the source app for design contracts before editing.");
  }
  return signals;
}

function buildDesignRisks(
  element: Element,
  style: CSSStyleDeclaration,
  density: TargetDesignAnalysis["density"]
): string[] {
  const risks: string[] = [];
  const text = cleanText(element.textContent, 2000).toLowerCase();
  const classText = classNamesFor(element).join(" ").toLowerCase();
  const background = `${style.backgroundImage} ${classText}`.toLowerCase();

  if (density.cardLike >= 3) {
    risks.push("Card-heavy area detected; avoid another equal-card treatment unless hierarchy requires containers.");
  }
  if (/purple|violet|indigo|from-blue|to-blue|from-purple|to-purple/.test(background)) {
    risks.push("Possible purple-blue AI gradient signal; keep it only if brand evidence supports it.");
  }
  if (/lorem|john doe|jane doe|99\.9|10,000|next-gen|seamless|unleash|elevate/.test(text)) {
    risks.push("Generic filler copy or fake proof may be present; replace with real content or honest placeholders.");
  }
  if (density.media === 0 && text.length < 260) {
    risks.push("Sparse target with no media; do not fill empty space with decorative blobs, fake metrics, or SVG illustrations.");
  }
  if (/inter|arial|helvetica/.test(style.fontFamily.toLowerCase())) {
    risks.push("Generic font stack detected; only keep it if the app design system requires it.");
  }
  if (density.buttons + density.links > 0) {
    risks.push("Controls detected; source implementation must preserve accessible focus and interaction states.");
  }
  return risks;
}

function isVisibleElement(element: Element): boolean {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function addCount(map: Map<string, number>, rawValue: string): void {
  const value = rawValue.replace(/\s+/g, " ").trim();
  if (!value || value === "normal" || value === "none" || value === "auto") return;
  if (value === "rgba(0, 0, 0, 0)" || value === "transparent" || value === "currentcolor") return;
  map.set(value, (map.get(value) || 0) + 1);
}

function topCounts(map: Map<string, number>, limit: number): Array<{ value: string; count: number }> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function fontFamilyName(fontFamily: string): string {
  return fontFamily.split(",")[0]?.replace(/["']/g, "").trim() || fontFamily;
}

function spacingValues(value: string): string[] {
  return value
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => /\d/.test(part) && part !== "0px");
}

function assetRoleFor(element: Element): string {
  const text = `${element.getAttribute("alt") || ""} ${element.getAttribute("aria-label") || ""} ${
    element.getAttribute("class") || ""
  } ${assetSourceFor(element)}`.toLowerCase();
  if (/logo|brand|mark/.test(text)) return "brand";
  if (/avatar|portrait|person|team/.test(text)) return "people";
  if (/screen|dashboard|app|product|render|device/.test(text)) return "product";
  if (element.tagName.toLowerCase() === "svg") return "icon-or-vector";
  return "content";
}

function pageFrameworkHints(): string[] {
  const html = document.documentElement.innerHTML.slice(0, 160000).toLowerCase();
  const hints: string[] = [];
  if (/\bsm:|\bmd:|\blg:|data-tailwind|tailwind/.test(html)) hints.push("Tailwind-style utility classes");
  if (/data-radix|radix-ui/.test(html)) hints.push("Radix UI primitives");
  if (/data-slot|shadcn/.test(html)) hints.push("shadcn-style component slots");
  if (/chakra|data-scope/.test(html)) hints.push("Chakra or Ark-style components");
  if (/mui-|material-ui/.test(html)) hints.push("Material UI");
  if (/ant-btn|ant-/.test(html)) hints.push("Ant Design");
  if (/framer-motion|data-framer/.test(html)) hints.push("Framer motion");
  return Array.from(new Set(hints)).slice(0, 8);
}

function pageDesignSignals(dna: PageDesignDna): string[] {
  const signals: string[] = [];
  if (dna.assets.some((asset) => asset.role === "brand")) {
    signals.push("Brand-like assets are visible; reuse the real mark instead of inventing identity.");
  }
  if (dna.assets.some((asset) => asset.role === "product")) {
    signals.push("Product or UI imagery is visible; let real assets carry the visual signal.");
  }
  if (dna.tokens.fonts.length > 0) {
    signals.push(`Dominant font signal: ${dna.tokens.fonts[0].family}.`);
  }
  if (dna.tokens.colors.length > 0) {
    signals.push(`Dominant color signal: ${dna.tokens.colors[0].value}.`);
  }
  if (dna.componentSignals.forms > 0 || dna.componentSignals.inputs > 0) {
    signals.push("Forms are present; preserve labels, helper text, errors, focus, and disabled states.");
  }
  if (dna.componentSignals.cards >= 3) {
    signals.push("Repeated card-like structures are present; prefer rhythm and hierarchy over adding more boxes.");
  }
  return signals;
}

function pageDesignRisks(dna: PageDesignDna, text: string): string[] {
  const risks: string[] = [];
  const fonts = dna.tokens.fonts.map((font) => font.family.toLowerCase()).join(" ");
  const colors = dna.tokens.colors.map((color) => color.value.toLowerCase()).join(" ");

  if (/inter|arial|helvetica|roboto/.test(fonts)) {
    risks.push("Generic font signal detected; keep it only if the target app contract requires it.");
  }
  if (/purple|violet|indigo|rgb\(99, 102, 241\)|rgb\(124, 58, 237\)/.test(colors)) {
    risks.push("Purple-blue AI color signal detected; require brand evidence before extending it.");
  }
  if (/lorem|john doe|jane doe|99\.9|10,000|next-gen|seamless|unleash|elevate/.test(text)) {
    risks.push("Generic filler copy or fake proof appears in page text.");
  }
  if (dna.tokens.colors.length > 9) {
    risks.push("Many distinct color tokens detected; avoid adding new ad hoc colors.");
  }
  if (dna.componentSignals.cards >= 6) {
    risks.push("Card-heavy page detected; avoid generic card spam and use separators or asymmetry.");
  }
  if (dna.assets.length === 0) {
    risks.push("No visible page assets detected; use honest placeholders instead of decorative fake imagery.");
  }
  return risks;
}

function analyzePageDesignDna(): PageDesignDna {
  const colorCounts = new Map<string, number>();
  const colorRoles = new Map<string, Set<string>>();
  const fontCounts = new Map<string, number>();
  const radiusCounts = new Map<string, number>();
  const shadowCounts = new Map<string, number>();
  const spacingCounts = new Map<string, number>();
  const visibleElements = Array.from(document.body.querySelectorAll("*"))
    .filter((element) => element.id !== "wisppatch-root" && isVisibleElement(element))
    .slice(0, 220);

  for (const element of visibleElements) {
    const style = window.getComputedStyle(element);
    const font = fontFamilyName(style.fontFamily);
    addCount(fontCounts, font);
    for (const [role, value] of [
      ["text", style.color],
      ["background", style.backgroundColor],
      ["border", style.borderColor]
    ] as const) {
      addCount(colorCounts, value);
      if (colorCounts.has(value)) {
        const roles = colorRoles.get(value) || new Set<string>();
        roles.add(role);
        colorRoles.set(value, roles);
      }
    }
    addCount(radiusCounts, style.borderRadius);
    addCount(shadowCounts, style.boxShadow);
    for (const value of [
      ...spacingValues(style.padding),
      ...spacingValues(style.margin),
      ...spacingValues(style.gap),
      ...spacingValues(style.rowGap),
      ...spacingValues(style.columnGap)
    ]) {
      addCount(spacingCounts, value);
    }
  }

  const assets = Array.from(document.body.querySelectorAll("img,video,picture,canvas,svg"))
    .filter((element) => element.id !== "wisppatch-root" && isVisibleElement(element))
    .slice(0, 16)
    .map((element) => {
      const size = mediaSizeFor(element);
      return {
        kind: element.tagName.toLowerCase(),
        source: cleanText(assetSourceFor(element), 180),
        alt: element instanceof HTMLImageElement ? cleanText(element.alt, 120) : cleanText(element.getAttribute("aria-label"), 120),
        role: assetRoleFor(element),
        width: size.width,
        height: size.height
      };
    });
  const text = cleanText(document.body.textContent, 4000).toLowerCase();
  const tokens = {
    colors: topCounts(colorCounts, 12).map((color) => ({
      ...color,
      roles: Array.from(colorRoles.get(color.value) || [])
    })),
    fonts: topCounts(fontCounts, 8).map(({ value, count }) => ({ family: value, count })),
    radii: topCounts(radiusCounts, 8),
    shadows: topCounts(shadowCounts, 8),
    spacing: topCounts(spacingCounts, 12)
  };
  const dna: PageDesignDna = {
    title: cleanText(document.title, 120),
    language: document.documentElement.lang || "",
    colorScheme: window.getComputedStyle(document.documentElement).colorScheme || "",
    tokens,
    assets,
    componentSignals: {
      headings: document.body.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      links: document.body.querySelectorAll("a").length,
      buttons: document.body.querySelectorAll("button").length,
      inputs: document.body.querySelectorAll("input,select,textarea").length,
      media: document.body.querySelectorAll("img,video,picture,canvas,svg").length,
      navs: document.body.querySelectorAll("nav,[role='navigation']").length,
      forms: document.body.querySelectorAll("form").length,
      cards: document.body.querySelectorAll("article,li,.card,[class*='card'],[class*='Card']").length
    },
    frameworkHints: pageFrameworkHints(),
    designSignals: [],
    risks: []
  };
  dna.designSignals = pageDesignSignals(dna);
  dna.risks = pageDesignRisks(dna, text);
  return dna;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function retryGoalFor(previousGoal: string): string {
  const routeGoals = [
    "editorial asymmetric layout",
    "product clarity software polish",
    "design system token alignment",
    "signature top-tier product direction"
  ];
  const currentIndex = routeGoals.findIndex((goal) => goal.includes(state.recipe));
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : state.retryCount;
  void previousGoal;
  return routeGoals[nextIndex % routeGoals.length];
}

function iterationSummary(
  action: DesignIteration["action"],
  recipe: string,
  operations: VisualOperation[],
  intensity: number
): string {
  if (action === "undo") return "Removed the temporary patch so another direction can be explored.";
  const selectors = uniqueValues(operations.map((operation) => operation.selector)).slice(0, 3);
  const changed = selectors.length ? selectors.join(", ") : "no selectors";
  const pushNote = intensity > 1 ? " with stronger spacing and emphasis" : "";
  return `${recipe} pass${pushNote}; changed ${operations.length} operation(s) across ${changed}.`;
}

function recordIteration(
  action: DesignIteration["action"],
  goal: string,
  effectiveGoal: string,
  recipe: string,
  intensity: number,
  operations: VisualOperation[]
): void {
  const id = state.nextIterationId++;
  state.activeIterationId = operations.length > 0 ? id : null;
  state.iterations = [
    ...state.iterations.map((iteration) => ({ ...iteration, selected: false })),
    {
      id,
      action,
      goal,
      effectiveGoal,
      recipe,
      intensity,
      operationCount: operations.length,
      operationTypes: uniqueValues(operations.map((operation) => operation.type)),
      changedSelectors: uniqueValues(operations.map((operation) => operation.selector)).slice(0, 12),
      summary: iterationSummary(action, recipe, operations, intensity),
      selected: operations.length > 0
    }
  ].slice(-12);
}

function analyzeTarget(target: TargetInfo, phase: TargetDesignAnalysis["phase"]): TargetDesignAnalysis {
  const element = document.querySelector(target.selector);
  if (!element) {
    return {
      phase,
      summary: {
        tagName: "",
        id: "",
        classNames: [],
        role: "",
        ariaLabel: "",
        textSample: "",
        textLength: 0,
        childCount: 0
      },
      density: {
        headings: 0,
        links: 0,
        buttons: 0,
        inputs: 0,
        media: 0,
        lists: 0,
        cardLike: 0
      },
      visual: {
        display: "",
        fontFamily: "",
        fontSize: "",
        fontWeight: "",
        lineHeight: "",
        color: "",
        backgroundColor: "",
        backgroundImage: "",
        padding: "",
        gap: "",
        borderRadius: "",
        boxShadow: ""
      },
      structure: {
        headings: [],
        controls: [],
        media: []
      },
      designSignals: [],
      risks: ["Target element could not be found during analysis."]
    };
  }

  const style = window.getComputedStyle(element);
  const normalizedText = (element.textContent || "").replace(/\s+/g, " ").trim();
  const headings = Array.from(element.querySelectorAll("h1,h2,h3"))
    .slice(0, 8)
    .map((node) => cleanText(node.textContent, 90))
    .filter(Boolean);
  const controls = Array.from(element.querySelectorAll("a,button,input,select,textarea"))
    .slice(0, 10)
    .map((node) => {
      const control = node as HTMLButtonElement | HTMLInputElement | HTMLAnchorElement;
      return {
        kind: node.tagName.toLowerCase(),
        text:
          cleanText(node.textContent, 80) ||
          cleanText((control as HTMLInputElement).value, 80) ||
          cleanText((control as HTMLInputElement).placeholder, 80),
        role: node.getAttribute("role") || "",
        ariaLabel: node.getAttribute("aria-label") || "",
        disabled: "disabled" in control ? Boolean(control.disabled) : false
      };
    });
  const media = Array.from(element.querySelectorAll("img,video,picture,canvas,svg"))
    .slice(0, 10)
    .map((node) => {
      const size = mediaSizeFor(node);
      return {
        kind: node.tagName.toLowerCase(),
        source: cleanText(assetSourceFor(node), 160),
        alt: node instanceof HTMLImageElement ? cleanText(node.alt, 120) : "",
        width: size.width,
        height: size.height
      };
    });
  const density = {
    headings: headings.length,
    links: element.querySelectorAll("a").length,
    buttons: element.querySelectorAll("button").length,
    inputs: element.querySelectorAll("input,select,textarea").length,
    media: element.querySelectorAll("img,video,picture,canvas,svg").length,
    lists: element.querySelectorAll("ul,ol,dl,table").length,
    cardLike: element.querySelectorAll("article,li,.card,[class*='card'],[class*='Card']").length
  };

  return {
    phase,
    summary: {
      tagName: element.tagName.toLowerCase(),
      id: element.id || "",
      classNames: classNamesFor(element),
      role: element.getAttribute("role") || "",
      ariaLabel: element.getAttribute("aria-label") || "",
      textSample: cleanText(element.textContent, 220),
      textLength: normalizedText.length,
      childCount: element.children.length
    },
    density,
    visual: {
      display: style.display,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      color: style.color,
      backgroundColor: style.backgroundColor,
      backgroundImage: cleanText(style.backgroundImage, 180),
      padding: style.padding,
      gap: style.gap,
      borderRadius: style.borderRadius,
      boxShadow: cleanText(style.boxShadow, 180)
    },
    structure: {
      headings,
      controls,
      media
    },
    designSignals: buildDesignSignals(target, element, density),
    risks: buildDesignRisks(element, style, density)
  };
}

function createPayload(): PatchPayload | null {
  if (!state.target) return null;
  return {
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    goal: state.goal || "Make this section feel more polished.",
    recipe: state.recipe,
    target: state.target,
    operations: state.operations,
    acceptedIterationId: state.activeIterationId || undefined,
    iterations: state.iterations.map((iteration) => ({
      ...iteration,
      selected: iteration.id === state.activeIterationId
    })),
    designDna: analyzePageDesignDna(),
    analysis: {
      before: state.beforeAnalysis || undefined,
      after: state.operations.length > 0 ? analyzeTarget(state.target, "after") : undefined
    }
  };
}

function refreshTargetBounds(target: TargetInfo): TargetInfo {
  try {
    const element = document.querySelector(target.selector);
    if (!element) return target;
    const rect = element.getBoundingClientRect();
    return {
      ...target,
      bounds: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    };
  } catch {
    return target;
  }
}

async function postBridge(path: string, payload: unknown): Promise<unknown> {
  if (!config?.bridgeUrl) {
    throw new Error("WispPatch bridge is not available.");
  }

  const response = await fetch(`${config.bridgeUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error || "WispPatch bridge request failed.");
  }
  return json;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function bootstrap(): Promise<void> {
  if (document.getElementById("wisppatch-root")) return;

  const host = document.createElement("div");
  host.id = "wisppatch-root";
  host.style.cssText = [
    "position:fixed",
    "inset:0",
    "width:100vw",
    "height:100vh",
    "overflow:visible",
    "pointer-events:none",
    "z-index:2147483000",
    "contain:layout style",
    "display:block"
  ].join(";");
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = WISPPATCH_CSS;

  const shell = document.createElement("div");
  shell.className = "wp-shell";
  shell.innerHTML = `
    <div class="wp-outline"></div>
    <div class="wp-scan-ring"></div>
    <div class="wp-trail"></div>
    <div class="wp-particles"></div>
    <div class="wp-wisp-stage" data-state="idle">
      <div class="wp-wisp-shadow"></div>
      <div class="wp-wisp" data-state="idle">${createWispSprite("stage")}</div>
      <div class="wp-idle-bubble">Click a section</div>
    </div>
    <div class="wp-panel" data-open="false" data-mode="prompt">
      <div class="wp-toast"></div>
      <div class="wp-bubble">
        <p class="wp-status">What should I patch here?</p>
        <form class="wp-form">
          <span class="wp-mini-wisp">${createWispSprite("mini")}</span>
          <input class="wp-input" placeholder="What should I patch?" />
          <button class="wp-submit" type="submit" aria-label="Apply patch"></button>
        </form>
        <div class="wp-chips">
          <button class="wp-chip" type="button" data-goal="signature top-tier product direction"><span class="wp-chip-icon wp-spark"></span>Signature polish</button>
          <button class="wp-chip" type="button" data-goal="design system polish"><span class="wp-chip-icon wp-frame"></span>Design system</button>
          <button class="wp-chip" type="button" data-goal="editorial asymmetric layout"><span class="wp-chip-icon wp-moon"></span>Editorial layout</button>
          <button class="wp-chip" type="button" data-goal="conversion CTA focus"><span class="wp-chip-icon wp-bolt"></span>CTA focus</button>
        </div>
      </div>
      <div class="wp-approval">
        <button class="wp-action is-primary" type="button" data-action="export"><span><svg class="is-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.2 6.1 6.3 3.4-6.3 3.4L12 21.5l-2.2-6.1-6.3-3.4 6.3-3.4Z"/></svg>Lock It In<svg class="is-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.2 6.1 6.3 3.4-6.3 3.4L12 21.5l-2.2-6.1-6.3-3.4 6.3-3.4Z"/></svg></span></button>
        <button class="wp-action" type="button" data-action="retry"><span>Try Again<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 6.3M20 5.5V11h-5.5"/></svg></span></button>
        <button class="wp-action" type="button" data-action="push"><span>Push Further<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18L18 6M9.5 6H18v8.5"/></svg></span></button>
        <button class="wp-action is-ghost" type="button" data-action="undo"><span>Undo<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg></span></button>
      </div>
    </div>
  `;

  shadow.append(style, shell);

  const outline = shadow.querySelector(".wp-outline") as HTMLElement;
  const scanRing = shadow.querySelector(".wp-scan-ring") as HTMLElement;
  const trail = shadow.querySelector(".wp-trail") as HTMLElement;
  const particles = shadow.querySelector(".wp-particles") as HTMLElement;
  const wispStage = shadow.querySelector(".wp-wisp-stage") as HTMLElement;
  const wisp = shadow.querySelector(".wp-wisp") as HTMLElement;
  const status = shadow.querySelector(".wp-status");
  const form = shadow.querySelector(".wp-form") as HTMLFormElement;
  const input = shadow.querySelector(".wp-input") as HTMLInputElement;
  const approval = shadow.querySelector(".wp-approval") as HTMLElement;
  const panel = shadow.querySelector(".wp-panel") as HTMLElement;
  const toast = shadow.querySelector(".wp-toast") as HTMLElement;

  let toastTimer = 0;
  let sequenceId = 0;
  let motionFrame = 0;
  let motionCancel: ((finished: boolean) => void) | null = null;
  let wispPoint = {
    x: Math.max(12, window.innerWidth - 170),
    y: Math.max(12, window.innerHeight - 178)
  };

  function showToast(message: string): void {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function wispCenter(): { x: number; y: number } {
    return { x: wispPoint.x + 59, y: wispPoint.y + 50 };
  }

  function spawnParticle(x: number, y: number, kind: "trail" | "burst" | "star" = "trail", angle = 0): void {
    if (particles.childElementCount > 70) return;
    const el = document.createElement("span");
    el.className = `wp-particle is-${kind}`;
    const spread = kind === "trail" ? 22 : 8;
    el.style.left = `${x + (Math.random() - 0.5) * spread}px`;
    el.style.top = `${y + (Math.random() - 0.5) * spread}px`;
    const distance = kind === "trail" ? 12 + Math.random() * 20 : 24 + Math.random() * 34;
    const theta =
      kind === "trail"
        ? angle + Math.PI + (Math.random() - 0.5) * 0.9
        : Math.random() * Math.PI * 2;
    el.style.setProperty("--dx", `${Math.cos(theta) * distance}px`);
    el.style.setProperty("--dy", `${Math.sin(theta) * distance - (kind === "trail" ? 3 : 6)}px`);
    el.style.setProperty("--ps", `${0.55 + Math.random() * 0.85}`);
    particles.appendChild(el);
    window.setTimeout(() => el.remove(), 820);
  }

  function burstAt(x: number, y: number, count = 10): void {
    for (let index = 0; index < count; index += 1) {
      spawnParticle(x, y, index % 3 === 0 ? "star" : "burst");
    }
  }

  function sparkleBounds(bounds: TargetInfo["bounds"], count = 12): void {
    for (let index = 0; index < count; index += 1) {
      window.setTimeout(() => {
        const x = bounds.x + 14 + Math.random() * Math.max(20, bounds.width - 28);
        const y = bounds.y + 12 + Math.random() * Math.max(16, bounds.height - 24);
        spawnParticle(x, y, Math.random() > 0.4 ? "star" : "burst");
      }, index * 46);
    }
  }

  function setWispState(next: WispState): void {
    if (state.wispState === next && wisp.dataset.state === next && wispStage.dataset.state === next) {
      return;
    }
    state.wispState = next;
    wisp.dataset.state = next;
    wispStage.dataset.state = next;
  }

  function setWispGaze(next: WispGaze): void {
    wispStage.dataset.gaze = next;
  }

  function markArrival(): void {
    wispStage.classList.remove("is-arriving");
    void wispStage.offsetWidth;
    wispStage.classList.add("is-arriving");
    const center = wispCenter();
    burstAt(center.x, center.y, 9);
    window.setTimeout(() => wispStage.classList.remove("is-arriving"), 440);
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function easeInOutSine(value: number): number {
    return -(Math.cos(Math.PI * value) - 1) / 2;
  }

  function smootherStep(value: number): number {
    return value * value * value * (value * (value * 6 - 15) + 10);
  }

  function applyWispPoint(x: number, y: number, trailActive = false, angle = -11): void {
    const nextX = clamp(x, 12, window.innerWidth - 148);
    const nextY = clamp(y, 12, window.innerHeight - 158);
    wispPoint = { x: nextX, y: nextY };
    wispStage.style.setProperty("--wp-x", `${nextX}px`);
    wispStage.style.setProperty("--wp-y", `${nextY}px`);
    wispStage.style.setProperty("--wp-flight-angle", `${angle}deg`);
    trail.style.left = `${nextX + 10}px`;
    trail.style.top = `${nextY + 42}px`;
    trail.style.setProperty("--wp-trail-angle", `${angle}deg`);
    trail.classList.toggle("is-active", trailActive);
  }

  function setWispFacing(nextX: number): void {
    if (Math.abs(nextX - wispPoint.x) < 4) return;
    wispStage.dataset.facing = nextX < wispPoint.x ? "left" : "right";
  }

  function facePoint(x: number): void {
    setWispFacing(x);
  }

  function faceTarget(bounds: TargetInfo["bounds"]): void {
    setWispGaze("target");
    facePoint(bounds.x + bounds.width / 2);
  }

  function faceUser(): void {
    setWispGaze("user");
    facePoint(window.innerWidth / 2);
  }

  function animateWispPoint(
    x: number,
    y: number,
    options: { trail?: boolean; duration?: number; arc?: number } = {}
  ): Promise<boolean> {
    window.cancelAnimationFrame(motionFrame);
    if (motionCancel) motionCancel(false);

    const nextX = clamp(x, 12, window.innerWidth - 148);
    const nextY = clamp(y, 12, window.innerHeight - 158);
    const startX = wispPoint.x;
    const startY = wispPoint.y;
    const dx = nextX - startX;
    const dy = nextY - startY;
    const distance = Math.hypot(dx, dy);
    const duration = options.duration ?? clamp(distance * 1.42, 920, 1540);
    const arc = options.arc ?? clamp(distance * 0.12, 16, 58);
    const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const baseAngleRad = Math.atan2(dy, dx);
    const startedAt = performance.now();
    let lastTrailAt = 0;

    setWispFacing(nextX);
    setWispGaze("flight");
    wispStage.dataset.moving = "true";
    const facingLeft = wispStage.dataset.facing === "left";
    const lean = clamp(Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI) * 0.32, -22, 22);
    wispStage.style.setProperty("--wp-lean", `${facingLeft ? -lean : lean}deg`);

    return new Promise((resolve) => {
      motionCancel = (finished) => {
        window.cancelAnimationFrame(motionFrame);
        trail.classList.remove("is-active");
        if (!finished) {
          wispStage.dataset.moving = "false";
          wispStage.style.setProperty("--wp-lean", "0deg");
        }
        resolve(finished);
      };

      const step = (now: number): void => {
        const raw = clamp((now - startedAt) / duration, 0, 1);
        const eased = easeInOutSine(raw);
        const arcEase = smootherStep(raw);
        const lift = Math.sin(Math.PI * raw) * arc;
        const drift = Math.sin(raw * Math.PI * 2) * 2.2 * (1 - arcEase);
        applyWispPoint(startX + dx * eased, startY + dy * eased - lift + drift, options.trail ?? true, baseAngle);

        if ((options.trail ?? true) && now - lastTrailAt > 30 && raw > 0.04 && raw < 0.96) {
          lastTrailAt = now;
          const center = wispCenter();
          spawnParticle(center.x, center.y, "trail", baseAngleRad);
          if (Math.random() > 0.72) spawnParticle(center.x, center.y, "star", baseAngleRad);
        }

        if (raw < 1) {
          motionFrame = window.requestAnimationFrame(step);
          return;
        }

        applyWispPoint(nextX, nextY, false, baseAngle);
        wispStage.dataset.moving = "false";
        wispStage.style.setProperty("--wp-lean", "0deg");
        motionCancel = null;
        resolve(true);
      };

      motionFrame = window.requestAnimationFrame(step);
    });
  }

  function moveWispHome(): Promise<boolean> {
    return animateWispPoint(window.innerWidth - 170, window.innerHeight - 178, {
      trail: false,
      duration: 520,
      arc: 34
    });
  }

  function getWispTargetPoint(bounds: TargetInfo["bounds"]): { x: number; y: number } {
    if (bounds.width < 420 && bounds.height < 190) {
      const canSitRight = bounds.x + bounds.width + 150 < window.innerWidth;
      const canSitLeft = bounds.x - 150 > 0;
      if (canSitRight || canSitLeft) {
        return {
          x: canSitRight ? bounds.x + bounds.width + 18 : bounds.x - 138,
          y: bounds.y + bounds.height / 2 - 62
        };
      }

      return {
        x: bounds.x + bounds.width / 2 - 56,
        y: bounds.y - 128
      };
    }

    return {
      x: bounds.x + Math.min(bounds.width - 106, Math.max(20, bounds.width * 0.72)),
      y: bounds.y + Math.min(bounds.height - 118, Math.max(24, bounds.height * 0.55))
    };
  }

  function moveWispTo(bounds: TargetInfo["bounds"] | null, trailActive = true): Promise<boolean> {
    if (!bounds) {
      return moveWispHome();
    }

    const point = getWispTargetPoint(bounds);
    return animateWispPoint(point.x, point.y, { trail: trailActive });
  }

  function distanceFromWispTo(bounds: TargetInfo["bounds"]): number {
    const point = getWispTargetPoint(bounds);
    return Math.hypot(point.x - wispPoint.x, point.y - wispPoint.y);
  }

  function setPanelOpen(open: boolean): void {
    panel.dataset.open = open ? "true" : "false";
  }

  function setPanelMode(mode: PanelMode): void {
    panel.dataset.mode = mode;
    approval.classList.toggle("is-visible", mode === "approval");
  }

  function placePanelNearTarget(bounds: TargetInfo["bounds"], withApproval = false): void {
    void bounds;
    const mode = panel.dataset.mode;
    const panelWidth = withApproval ? 384 : mode === "prompt" ? 404 : 258;
    const expectedHeight = withApproval ? 348 : mode === "prompt" ? 224 : 100;
    const anchorX = wispPoint.x + 64;
    const anchorY = wispPoint.y + 18;
    const desiredX = wispPoint.x + 96;
    const x = clamp(desiredX, 16, window.innerWidth - panelWidth - 16);
    const y = clamp(wispPoint.y - expectedHeight - 20, 16, window.innerHeight - expectedHeight - 16);
    const tailX = clamp(((anchorX - x) / panelWidth) * 100, 12, 88);
    const tailY = clamp(anchorY - y, 18, expectedHeight - 8);
    panel.style.setProperty("--wp-panel-x", `${x}px`);
    panel.style.setProperty("--wp-panel-y", `${y}px`);
    panel.style.setProperty("--wp-tail-x", `${tailX}%`);
    panel.style.setProperty("--wp-tail-y", `${tailY}px`);
  }

  function updateScanRing(bounds: TargetInfo["bounds"] | null, active: boolean): void {
    if (!bounds || !active) {
      scanRing.classList.remove("is-active");
      return;
    }

    scanRing.style.left = `${bounds.x + bounds.width / 2}px`;
    scanRing.style.top = `${bounds.y + bounds.height / 2}px`;
    scanRing.classList.add("is-active");
  }

  function setOutlineBounds(bounds: TargetInfo["bounds"]): void {
    outline.style.left = `${bounds.x}px`;
    outline.style.top = `${bounds.y}px`;
    outline.style.width = `${bounds.width}px`;
    outline.style.height = `${bounds.height}px`;
    outline.classList.add("is-visible");
  }

  async function captureBefore(): Promise<void> {
    const payload = createPayload();
    if (!payload) return;
    try {
      await postBridge("/capture-before", payload);
    } catch (error) {
      console.warn(
        "WispPatch could not capture the before state.",
        error instanceof Error ? error.message : error
      );
    }
  }

  async function runPatch(goal: string, action: DesignIteration["action"] = "initial"): Promise<void> {
    if (!state.target) {
      showToast("Click a section first.");
      setWispState("targeting");
      setText(status, "Pick the section Wisp should patch");
      return;
    }

    const sequence = ++sequenceId;
    const requestedGoal = goal || state.goal || "Make this section feel more polished.";
    const effectiveGoal = action === "retry" ? retryGoalFor(requestedGoal) : requestedGoal;
    state.goal = action === "retry" ? effectiveGoal : requestedGoal;
    if (action === "push") state.pushCount += 1;
    if (action === "retry") {
      state.retryCount += 1;
      state.pushCount = 0;
    }
    if (action === "initial" || action === "refine") {
      state.pushCount = 0;
    }

    setPanelMode("working");
    setPanelOpen(true);
    setText(status, "Locking onto the target");
    placePanelNearTarget(state.target.bounds, false);

    if (distanceFromWispTo(state.target.bounds) > 28) {
      setWispState("flying");
      const arrivedForPatch = await moveWispTo(state.target.bounds);
      if (!arrivedForPatch) return;
      markArrival();
    }

    if (sequence !== sequenceId) return;

    setWispState("scanning");
    faceTarget(state.target.bounds);
    setText(status, "Reading the section");
    updateScanRing(state.target.bounds, true);
    placePanelNearTarget(state.target.bounds, false);
    await sleep(760);
    if (sequence !== sequenceId) return;

    setWispState("patching");
    setText(status, "Applying the patch");
    sparkleBounds(state.target.bounds, 14);
    const intensity = state.pushCount + 1;
    if (state.operations.length > 0) {
      clearOperations();
      state.operations = [];
      state.target = refreshTargetBounds(state.target);
    }
    const designDna = analyzePageDesignDna();
    const result = createRecipe(effectiveGoal, state.target, intensity, designDna);
    state.recipe = result.recipe;
    state.operations = result.operations;
    applyOperations(result.operations);
    recordIteration(action, requestedGoal, effectiveGoal, result.recipe, intensity, result.operations);
    await sleep(420);
    if (sequence !== sequenceId) return;

    updateScanRing(null, false);
    setWispState("presenting");
    await moveWispTo(state.target.bounds, false);
    if (sequence !== sequenceId) return;
    faceUser();
    placePanelNearTarget(state.target.bounds, true);
    setPanelMode("approval");
    setPanelOpen(true);
    setText(status, "Design pass ready. Type a tweak or lock it in.");
    input.value = "";
    input.placeholder = "Ask Wisp for one more change";
  }

  async function handleSelect(target: TargetInfo): Promise<void> {
    const sequence = ++sequenceId;
    let nextTarget = target;
    if (state.operations.length > 0) {
      clearOperations();
      nextTarget = refreshTargetBounds(target);
    }
    state.target = nextTarget;
    state.beforeAnalysis = analyzeTarget(nextTarget, "before");
    state.pushCount = 0;
    state.retryCount = 0;
    state.operations = [];
    state.activeIterationId = null;
    state.nextIterationId = 1;
    state.iterations = [];
    setOutlineBounds(nextTarget.bounds);
    updateScanRing(null, false);
    setPanelOpen(false);
    setPanelMode("working");
    setWispState("flying");
    setWispGaze("flight");
    const arrivedAtTarget = moveWispTo(nextTarget.bounds, true);
    placePanelNearTarget(nextTarget.bounds, false);
    setText(status, "Flying in");
    if (!(await arrivedAtTarget)) return;
    markArrival();
    if (sequence !== sequenceId) return;

    setWispState("scanning");
    faceTarget(nextTarget.bounds);
    updateScanRing(nextTarget.bounds, true);
    setText(status, "Looking this over");
    await sleep(480);
    updateScanRing(null, false);
    if (sequence !== sequenceId) return;

    setWispState("listening");
    faceUser();
    setPanelMode("prompt");
    placePanelNearTarget(nextTarget.bounds, false);
    setPanelOpen(true);
    setText(status, "What should I patch here?");
    input.focus();
    void captureBefore();
  }

  const picker = createTargetPicker({
    onHover(bounds, pointer) {
      if (!bounds) {
        outline.classList.remove("is-visible");
        return;
      }

      setOutlineBounds(bounds);
      void pointer;
    },
    onSelect(target) {
      void handleSelect(target);
    },
    canSelect() {
      return state.wispState !== "scanning" && state.wispState !== "patching";
    }
  });

  picker.start();
  setWispState("targeting");
  moveWispHome();
  setPanelOpen(false);

  let gazeFrame = 0;
  window.addEventListener("pointermove", (event) => {
    if (wispStage.dataset.moving === "true" || gazeFrame) return;
    gazeFrame = window.requestAnimationFrame(() => {
      gazeFrame = 0;
      const center = wispCenter();
      const dx = event.clientX - center.x;
      const dy = event.clientY - center.y;
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(3.4, distance / 56);
      const flip = wispStage.dataset.facing === "left" ? -1 : 1;
      wispStage.style.setProperty("--wp-gaze-x", `${(dx / distance) * reach * flip}px`);
      wispStage.style.setProperty("--wp-gaze-y", `${(dy / distance) * reach}px`);
    });
  });

  window.addEventListener("resize", () => {
    if (state.target && state.wispState !== "targeting") {
      moveWispTo(state.target.bounds, false);
    } else {
      moveWispHome();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void runPatch(input.value.trim(), state.operations.length > 0 ? "refine" : "initial");
  });

  shadow.querySelectorAll<HTMLButtonElement>(".wp-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const goal = chip.dataset.goal || chip.textContent || "";
      input.value = goal;
      void runPatch(goal, "initial");
    });
  });

  shadow.querySelectorAll<HTMLButtonElement>(".wp-action").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      if (action === "undo") {
        clearOperations();
        state.operations = [];
        recordIteration("undo", state.goal || input.value.trim(), state.goal || input.value.trim(), "none", 0, []);
        setPanelMode("prompt");
        setPanelOpen(true);
        setWispState("listening");
        if (state.target && distanceFromWispTo(state.target.bounds) > 28) {
          await moveWispTo(state.target.bounds, false);
        }
        faceUser();
        setText(status, "Patch undone. Try another direction.");
        showToast("Temporary patch removed.");
      }

      if (action === "chat") {
        setPanelMode("prompt");
        setPanelOpen(true);
        setWispState("listening");
        if (state.target && distanceFromWispTo(state.target.bounds) > 28) {
          await moveWispTo(state.target.bounds, false);
        }
        faceUser();
        if (state.target) placePanelNearTarget(state.target.bounds, false);
        setText(status, "Tell Wisp what to change next.");
        input.value = "";
        input.placeholder = "What should I change next?";
        input.focus();
      }

      if (action === "retry") {
        clearOperations();
        state.operations = [];
        setPanelMode("working");
        await runPatch(input.value.trim() || state.goal || "signature top-tier product direction", "retry");
        input.value = state.goal;
      }

      if (action === "push") {
        setPanelMode("working");
        await runPatch(input.value.trim() || state.goal || "signature top-tier product direction", "push");
      }

      if (action === "export") {
        const payload = createPayload();
        if (!payload) return;
        try {
          const result = (await postBridge("/export", payload)) as { outputDir?: string };
          showToast(`Exported to ${result.outputDir || ".wisppatch/latest"}`);
          setWispState("success");
          const center = wispCenter();
          burstAt(center.x, center.y - 12, 16);
          setText(status, "Locked in. Patch exported.");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Export failed.");
        }
      }
    });
  });
}

void bootstrap();
