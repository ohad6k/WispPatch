import type { TargetInfo, VisualOperation } from "./types";

type RecipeResult = {
  recipe: string;
  operations: VisualOperation[];
};

type TargetProfile = {
  isHero: boolean;
  isCompact: boolean;
  isDense: boolean;
  hasCards: boolean;
  hasControls: boolean;
  hasMedia: boolean;
  hasLists: boolean;
  background: string;
};

const STYLE_ID = "wisppatch-patch-style";
const originalText = new Map<string, string>();

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function cssBlock(css: Record<string, string>): string {
  return Object.entries(css)
    .map(([key, value]) => `${kebab(key)}: ${value} !important;`)
    .join("\n");
}

function ensureStyle(): HTMLStyleElement {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  return style;
}

function targetSelector(target: TargetInfo): string {
  return target.selector;
}

function descendant(target: TargetInfo, selector: string): string {
  return selector
    .split(",")
    .map((part) => `${target.selector} ${part.trim()}`)
    .join(", ");
}

function op(selector: string, css: Record<string, string>): VisualOperation {
  return {
    type: "css_rule",
    selector,
    css
  };
}

function textOp(selector: string, text: string): VisualOperation {
  return {
    type: "text_replace",
    selector,
    text
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function sentenceCaseLike(source: string, value: string): string {
  if (!source || !value) return value;
  if (source === source.toUpperCase()) return value.toUpperCase();
  if (/^[A-Z]/.test(source) && /^[a-z]/.test(value)) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }
  return value;
}

function parseTextEdit(goal: string): { from: string; to: string } | null {
  const normalized = goal.trim().replace(/\s+/g, " ");
  const match = normalized.match(
    /^(?:change|rename|replace|update|make)\s+(?:the\s+)?["']?(.+?)["']?\s+(?:to|with|say)\s+["']?(.+?)["']?\.?$/i
  );
  if (!match) return null;
  const from = match[1].trim();
  const to = match[2].trim().replace(/[.!?]$/, "");
  if (!from || !to) return null;
  return { from, to };
}

function selectorForTextEdit(target: TargetInfo, from: string): { selector: string; text: string } | null {
  const targetElement = document.querySelector(target.selector);
  if (!targetElement) return null;

  const fromKey = normalizeText(from);
  const genericTargets = new Set(["text", "copy", "title", "heading", "headline", "label", "name"]);
  const preferred = Array.from(targetElement.querySelectorAll<HTMLElement>("h1,h2,h3,h4,[aria-label]"));

  for (const element of preferred) {
    const current = element.textContent?.trim() || element.getAttribute("aria-label") || "";
    if (!current) continue;
    const currentKey = normalizeText(current);
    if (genericTargets.has(fromKey) || currentKey.includes(fromKey)) {
      return {
        selector: `${target.selector} ${element.tagName.toLowerCase()}`,
        text: current
      };
    }
  }

  const current = targetElement.textContent?.trim() || "";
  if (!current) return null;
  if (genericTargets.has(fromKey) || normalizeText(current).includes(fromKey)) {
    return {
      selector: target.selector,
      text: current
    };
  }

  return null;
}

function textRecipe(goal: string, target: TargetInfo): RecipeResult | null {
  const edit = parseTextEdit(goal);
  if (!edit) return null;

  const match = selectorForTextEdit(target, edit.from);
  if (!match) return null;

  const sourceText = match.text;
  const fromKey = normalizeText(edit.from);
  const genericTargets = new Set(["text", "copy", "title", "heading", "headline", "label", "name"]);
  const nextText = genericTargets.has(fromKey)
    ? sentenceCaseLike(sourceText, edit.to)
    : sourceText.replace(
        new RegExp(edit.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        (found) => sentenceCaseLike(found, edit.to)
      );

  if (!nextText || nextText === sourceText) return null;

  return {
    recipe: "text",
    operations: [textOp(match.selector, nextText)]
  };
}

function inspectTarget(target: TargetInfo): TargetProfile {
  const element = document.querySelector(target.selector);
  const textLength = element?.textContent?.replace(/\s+/g, " ").trim().length ?? 0;
  const childCount = element?.children.length ?? 0;
  const hasCards = Boolean(
    element?.querySelector("article,li,.card,[class*='card'],[class*='Card']")
  );
  const hasControls = Boolean(element?.querySelector("a,button,input,select,textarea"));
  const hasMedia = Boolean(element?.querySelector("img,video,picture,canvas,svg"));
  const hasLists = Boolean(element?.querySelector("ul,ol,dl,table"));
  const computed = element ? window.getComputedStyle(element) : null;

  return {
    isHero: target.bounds.height > 360 && target.bounds.width > 640,
    isCompact: target.bounds.height < 220 || target.bounds.width < 420,
    isDense: textLength > 620 || childCount > 8 || hasLists,
    hasCards,
    hasControls,
    hasMedia,
    hasLists,
    background: computed?.backgroundColor || "transparent"
  };
}

export function chooseRecipe(goal: string): string {
  const normalized = goal.toLowerCase();
  if (/(signature|taste|high craft|top-tier|top tier)/.test(normalized)) return "signature";
  if (/(editorial|asymmetric|magazine|layout|hero)/.test(normalized)) return "editorial";
  if (/(system|brand|token|design system|polish)/.test(normalized)) return "system";
  if (/(focus|clean|quiet|product|app|software)/.test(normalized)) return "product";
  if (/(spacing|space|breath|breathe)/.test(normalized)) return "spacing";
  if (/(cta|button|conversion|action)/.test(normalized)) return "cta";
  if (/(card|cards|grid|bento)/.test(normalized)) return "cards";
  if (/(dark|night)/.test(normalized)) return "dark";
  return "signature";
}

function baseOperations(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  const targetSel = targetSelector(target);
  const basePadding = profile.isCompact
    ? push
      ? "28px"
      : "22px"
    : push
      ? "clamp(48px, 8vw, 108px) clamp(24px, 6vw, 72px)"
      : "clamp(40px, 7vw, 88px) clamp(22px, 5vw, 60px)";

  return [
    op(targetSel, {
      boxSizing: "border-box",
      isolation: "isolate",
      padding: basePadding,
      color: "color-mix(in oklch, currentColor 96%, #111827)",
      background:
        profile.background === "rgba(0, 0, 0, 0)" || profile.background === "transparent"
          ? "linear-gradient(180deg, #fbfaf7 0%, #f1f3f0 100%)"
          : profile.background,
      borderTop: "1px solid color-mix(in oklch, currentColor 10%, transparent)",
      borderBottom: "1px solid color-mix(in oklch, currentColor 10%, transparent)",
      borderRadius: profile.isCompact ? "16px" : "0",
      boxShadow: "none",
      overflow: "hidden"
    }),
    op(descendant(target, "h1,h2,h3"), {
      maxWidth: "min(860px, 100%)",
      margin: "0",
      letterSpacing: "0",
      lineHeight: "0.96",
      textWrap: "balance",
      fontWeight: "760"
    }),
    op(descendant(target, "p,li"), {
      maxWidth: "68ch",
      lineHeight: "1.65",
      textWrap: "pretty"
    }),
    op(descendant(target, "a,button,input,select,textarea"), {
      minHeight: "44px",
      transition:
        "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), background-color 220ms cubic-bezier(0.16, 1, 0.3, 1)"
    }),
    op(descendant(target, "a:hover,button:hover"), {
      transform: "translateY(-1px)"
    }),
    op(descendant(target, "a:active,button:active"), {
      transform: "translateY(1px) scale(0.99)"
    })
  ];
}

function signatureRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  const targetSel = targetSelector(target);
  const layout = profile.isHero && !profile.isDense ? "grid" : "block";
  return [
    ...baseOperations(target, profile, push),
    op(targetSel, {
      display: layout,
      gridTemplateColumns: profile.hasMedia ? "minmax(0, 1.08fr) minmax(280px, 0.92fr)" : "minmax(0, 1fr)",
      alignItems: "center",
      gap: push ? "clamp(28px, 5vw, 64px)" : "clamp(24px, 4vw, 48px)",
      background:
        "linear-gradient(180deg, #fbfaf7 0%, #f4f1e9 54%, #eef3f0 100%)",
      color: "#151a20"
    }),
    op(descendant(target, "h1,h2"), {
      fontSize: profile.isCompact
        ? "clamp(28px, 7vw, 46px)"
        : "clamp(42px, 8vw, 86px)",
      maxWidth: "11ch"
    }),
    op(descendant(target, "p"), {
      color: "#48515f",
      fontSize: "clamp(16px, 1.6vw, 20px)"
    }),
    op(descendant(target, "a,button"), {
      borderRadius: "999px",
      padding: push ? "15px 28px" : "13px 23px",
      background: "#151a20",
      color: "#fffaf0",
      border: "1px solid color-mix(in oklch, #151a20 72%, white)",
      boxShadow: "0 14px 36px rgba(21, 26, 32, 0.18)",
      fontWeight: "760"
    })
  ];
}

function productRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  const targetSel = targetSelector(target);
  return [
    ...baseOperations(target, profile, push),
    op(targetSel, {
      background: "#f9faf8",
      color: "#17202b",
      borderTop: "1px solid #dfe4df",
      borderBottom: "1px solid #dfe4df"
    }),
    op(descendant(target, "article,li,.card,[class*='card'],[class*='Card']"), {
      background: "transparent",
      border: "0",
      borderTop: "1px solid #dfe4df",
      borderRadius: "0",
      boxShadow: "none",
      padding: push ? "24px 0" : "20px 0"
    }),
    op(descendant(target, "h1,h2,h3"), {
      color: "#111827",
      fontWeight: "720"
    }),
    op(descendant(target, "p,li,span"), {
      color: "#56616f"
    }),
    op(descendant(target, "a,button"), {
      borderRadius: "8px",
      background: "#1f2937",
      color: "#ffffff",
      border: "1px solid #111827",
      boxShadow: "none"
    })
  ];
}

function editorialRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  const targetSel = targetSelector(target);
  return [
    ...baseOperations(target, profile, push),
    op(targetSel, {
      display: "grid",
      gridTemplateColumns: profile.isCompact ? "1fr" : "minmax(0, 0.74fr) minmax(240px, 0.26fr)",
      gap: push ? "clamp(24px, 7vw, 88px)" : "clamp(22px, 5vw, 64px)",
      alignItems: "start",
      background: "#f7f2e8",
      color: "#15110d"
    }),
    op(descendant(target, "h1,h2"), {
      fontSize: profile.isCompact
        ? "clamp(30px, 8vw, 52px)"
        : "clamp(56px, 10vw, 112px)",
      lineHeight: "0.9",
      maxWidth: "10ch",
      fontWeight: "820"
    }),
    op(descendant(target, "p"), {
      fontSize: "clamp(16px, 1.4vw, 19px)",
      color: "#594f43"
    }),
    op(descendant(target, "img,video,picture,canvas"), {
      borderRadius: "0",
      aspectRatio: "4 / 3",
      objectFit: "cover",
      filter: "saturate(0.92) contrast(1.04)"
    })
  ];
}

function systemRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push),
    op(targetSelector(target), {
      background: "#ffffff",
      color: "#111827",
      border: "1px solid #e4e7ec",
      borderRadius: profile.isCompact ? "14px" : "18px",
      boxShadow: "0 18px 54px rgba(17, 24, 39, 0.08)"
    }),
    op(descendant(target, "h1,h2,h3"), {
      fontWeight: "700",
      color: "#111827"
    }),
    op(descendant(target, "p,li,span"), {
      color: "#4b5563"
    }),
    op(descendant(target, "a,button,input,select,textarea"), {
      borderRadius: "10px",
      border: "1px solid #d7dce4",
      boxShadow: "0 1px 0 rgba(17, 24, 39, 0.04)"
    })
  ];
}

function spacingRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push),
    op(descendant(target, "* + *"), {
      marginTop: push ? "clamp(18px, 2vw, 30px)" : "clamp(14px, 1.6vw, 24px)"
    }),
    op(descendant(target, "h1 + *,h2 + *,h3 + *"), {
      marginTop: "clamp(16px, 2vw, 28px)"
    })
  ];
}

function ctaRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push),
    op(descendant(target, "a,button"), {
      borderRadius: "999px",
      padding: push ? "16px 30px" : "14px 24px",
      background: "#111827",
      color: "#fffaf0",
      border: "1px solid #111827",
      boxShadow: "0 16px 34px rgba(17, 24, 39, 0.18)",
      fontWeight: "780"
    }),
    op(descendant(target, "a + a,button + button"), {
      background: "transparent",
      color: "#111827",
      boxShadow: "none",
      border: "1px solid #cfd6df"
    })
  ];
}

function cardsRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push),
    op(descendant(target, "article,li,.card,[class*='card'],[class*='Card']"), {
      background: "#ffffff",
      border: "1px solid #dfe4ea",
      borderRadius: push ? "14px" : "10px",
      boxShadow: "none",
      padding: push ? "26px" : "22px"
    }),
    op(descendant(target, "article:nth-child(2n),li:nth-child(2n),.card:nth-child(2n)"), {
      transform: profile.isCompact ? "none" : "translateY(10px)"
    })
  ];
}

function darkRecipe(target: TargetInfo, profile: TargetProfile, push: boolean): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push),
    op(targetSelector(target), {
      background: "#171c22",
      color: "#f8fafc",
      borderColor: "#2b333d",
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
    }),
    op(descendant(target, "p,span,li"), {
      color: "rgba(248, 250, 252, 0.78)"
    }),
    op(descendant(target, "a,button"), {
      background: "#f3c744",
      color: "#151a20",
      border: "1px solid rgba(243, 199, 68, 0.82)",
      boxShadow: "0 14px 30px rgba(0, 0, 0, 0.24)"
    })
  ];
}

export function createRecipe(goal: string, target: TargetInfo, intensity = 1): RecipeResult {
  const textResult = textRecipe(goal, target);
  if (textResult) return textResult;

  const recipe = chooseRecipe(goal);
  const profile = inspectTarget(target);
  const push = intensity > 1;
  const recipes: Record<string, () => VisualOperation[]> = {
    signature: () => signatureRecipe(target, profile, push),
    product: () => productRecipe(target, profile, push),
    editorial: () => editorialRecipe(target, profile, push),
    system: () => systemRecipe(target, profile, push),
    spacing: () => spacingRecipe(target, profile, push),
    cta: () => ctaRecipe(target, profile, push),
    cards: () => cardsRecipe(target, profile, push),
    dark: () => darkRecipe(target, profile, push)
  };

  return {
    recipe,
    operations: (recipes[recipe] || recipes.signature)()
  };
}

export function applyOperations(operations: VisualOperation[]): void {
  const style = ensureStyle();
  const rules = operations
    .filter((operation) => operation.type === "css_rule")
    .map((operation) => `${operation.selector} {\n${cssBlock(operation.css)}\n}`)
    .join("\n\n");
  style.textContent = rules;

  operations
    .filter((operation): operation is Extract<VisualOperation, { type: "text_replace" }> => operation.type === "text_replace")
    .forEach((operation) => {
      const element = document.querySelector(operation.selector);
      if (!element) return;
      if (!originalText.has(operation.selector)) {
        originalText.set(operation.selector, element.textContent || "");
      }
      element.textContent = operation.text;
    });
}

export function clearOperations(): void {
  document.getElementById(STYLE_ID)?.remove();
  originalText.forEach((text, selector) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  });
  originalText.clear();
}
