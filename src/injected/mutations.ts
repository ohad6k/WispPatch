import type { PageDesignDna, TargetInfo, VisualOperation } from "./types";

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
  borderRadius: string;
  display: string;
  columnCount: number;
  ctaBackground: string | null;
  ctaColor: string | null;
  ctaRadius: string | null;
};

type RecipeContext = {
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  pageBackground: string;
  borderColor: string;
  accentColor: string;
  buttonTextColor: string;
  fontFamily: string;
  radius: string;
  cardRadius: string;
  shadow: string;
  aiPaletteRisk: boolean;
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

  let ctaBackground: string | null = null;
  let ctaColor: string | null = null;
  let ctaRadius: string | null = null;
  const scope = element || document.body;
  for (const control of Array.from(scope.querySelectorAll("a,button")).slice(0, 12)) {
    const style = window.getComputedStyle(control);
    const background = safeCssColor(style.backgroundColor);
    if (!background || isTransparent(style.backgroundColor)) continue;
    ctaBackground = background;
    ctaColor = safeCssColor(style.color);
    ctaRadius = style.borderRadius || null;
    break;
  }

  return {
    isHero: target.bounds.height > 360 && target.bounds.width > 640,
    isCompact: target.bounds.height < 220 || target.bounds.width < 420,
    isDense: textLength > 620 || childCount > 8 || hasLists,
    hasCards,
    hasControls,
    hasMedia,
    hasLists,
    background: computed?.backgroundColor || "transparent",
    borderRadius: computed?.borderRadius || "0px",
    display: computed?.display || "block",
    columnCount:
      computed?.display === "grid"
        ? (computed.gridTemplateColumns || "").split(" ").filter((part) => part.trim()).length
        : computed?.display === "flex"
          ? Math.min(childCount, 4)
          : 1,
    ctaBackground,
    ctaColor,
    ctaRadius
  };
}

function isTransparent(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "transparent") return true;
  const match = normalized.match(/rgba?\(([^)]+)\)/);
  if (!match) return false;
  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  return parts.length === 4 && parts[3] === 0;
}

function readableTextOn(background: string | null | undefined): string | null {
  const match = background?.trim().toLowerCase().match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b] = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#151a20" : "#ffffff";
}

function safeCssColor(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (/^(transparent|currentcolor|inherit|initial|unset)$/i.test(normalized)) return null;
  if (/\bnone\b/i.test(normalized)) return null;
  if (/gradient/i.test(normalized)) return null;
  const functionCount = normalized.match(/[a-z-]+\(/gi)?.length ?? 0;
  if (functionCount > 1 && !/^color-mix\(/i.test(normalized)) return null;
  if (/^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i.test(normalized)) {
    return normalized;
  }
  return null;
}

function safeCssLength(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === "0px") return null;
  if (/^-?\d+(\.\d+)?(px|rem|em|%)$/i.test(normalized)) return normalized;
  return null;
}

function isPurpleBlue(value: string): boolean {
  const normalized = value.toLowerCase();
  return /(purple|violet|indigo|#6d28d9|#7c3aed|#8b5cf6|#6366f1|rgb\(99,\s*102,\s*241\)|rgb\(124,\s*58,\s*237\))/i.test(
    normalized
  );
}

function colorByRole(dna: PageDesignDna | undefined, rolePattern: RegExp): string | null {
  const token = dna?.tokens.colors.find((color) => {
    if (!safeCssColor(color.value)) return false;
    return color.roles.some((role) => rolePattern.test(role));
  });
  return safeCssColor(token?.value);
}

function colorByRoleOnly(
  dna: PageDesignDna | undefined,
  rolePattern: RegExp,
  excludedRolePattern: RegExp
): string | null {
  const token = dna?.tokens.colors.find((color) => {
    if (!safeCssColor(color.value)) return false;
    return color.roles.some((role) => rolePattern.test(role)) && !color.roles.some((role) => excludedRolePattern.test(role));
  });
  return safeCssColor(token?.value);
}

function dominantColor(dna: PageDesignDna | undefined, excludePattern?: RegExp): string | null {
  const token = dna?.tokens.colors.find((color) => {
    if (!safeCssColor(color.value)) return false;
    if (excludePattern && color.roles.some((role) => excludePattern.test(role))) return false;
    return true;
  });
  return safeCssColor(token?.value);
}

function sameToken(a: string | null | undefined, b: string | null | undefined): boolean {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function dominantFont(dna: PageDesignDna | undefined): string {
  const family = dna?.tokens.fonts.find((font) => font.family.trim())?.family.trim();
  if (!family) return "Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif";
  if (/^aptos$/i.test(family)) return "Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif";
  if (/^(serif|sans-serif|monospace|system-ui|ui-sans-serif)$/i.test(family)) {
    return "Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif";
  }
  return `${family}, Aptos, Segoe UI, ui-sans-serif, system-ui, sans-serif`;
}

function tokenLength(
  tokens: Array<{ value: string; count: number }> | undefined,
  fallback: string,
  maximumPx = 28
): string {
  const token = tokens?.find((item) => {
    const value = safeCssLength(item.value);
    if (!value) return false;
    if (value.endsWith("px")) return Number.parseFloat(value) <= maximumPx;
    return true;
  });
  return safeCssLength(token?.value) ?? fallback;
}

function contextFor(dna: PageDesignDna | undefined, profile: TargetProfile): RecipeContext {
  const profileBackground = safeCssColor(profile.background);
  const aiPaletteRisk = Boolean(dna?.risks.some((risk) => /purple|blue|gradient|ai/i.test(risk)));
  const textColor =
    colorByRoleOnly(dna, /(text|foreground|color)/i, /(background|surface|border)/i) ??
    colorByRoleOnly(dna, /(text|foreground|color)/i, /(background|surface)/i) ??
    colorByRole(dna, /(text|foreground|color)/i) ??
    "#151a20";
  const surfaceCandidate =
    (sameToken(profileBackground, textColor) ? null : profileBackground) ??
    colorByRoleOnly(dna, /(background|surface)/i, /(text|foreground|color)/i) ??
    colorByRole(dna, /(background|surface)/i);
  const surfaceColor = sameToken(surfaceCandidate, textColor) ? "#fbfaf7" : surfaceCandidate ?? "#fbfaf7";
  const pageCandidate = sameToken(profileBackground, textColor) ? null : profileBackground;
  const pageBackground = pageCandidate ?? (sameToken(surfaceColor, textColor) ? "#f4f1ea" : surfaceColor);
  const borderColor =
    colorByRoleOnly(dna, /(border|outline)/i, /(text|background|surface)/i) ??
    "color-mix(in oklch, currentColor 14%, transparent)";
  const mutedColor = `color-mix(in oklch, ${textColor} 84%, ${surfaceColor})`;
  const dominant = dominantColor(dna, /(background|surface|border)/i);
  const sampledAccent =
    profile.ctaBackground && !(aiPaletteRisk && isPurpleBlue(profile.ctaBackground))
      ? profile.ctaBackground
      : null;
  const accentColor =
    sampledAccent ?? (dominant && !(aiPaletteRisk && isPurpleBlue(dominant)) ? dominant : textColor);
  const buttonTextColor =
    (sampledAccent ? safeCssColor(profile.ctaColor ?? undefined) : null) ??
    readableTextOn(accentColor) ??
    "color-mix(in oklch, white 92%, " + accentColor + ")";
  const radius = tokenLength(dna?.tokens.radii, "12px", 22);

  return {
    textColor,
    mutedColor,
    surfaceColor,
    pageBackground,
    borderColor,
    accentColor,
    buttonTextColor,
    fontFamily: dominantFont(dna),
    radius,
    cardRadius: tokenLength(dna?.tokens.radii, profile.isCompact ? "12px" : "16px", 28),
    shadow:
      dna?.tokens.shadows.find((shadow) => shadow.value !== "none" && shadow.value.length < 120)?.value ??
      `0 18px 54px color-mix(in oklch, ${textColor} 12%, transparent)`,
    aiPaletteRisk
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

function baseOperations(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  const targetSel = targetSelector(target);
  const basePadding = profile.isCompact
    ? push
      ? "28px"
      : "22px"
    : push
      ? "clamp(40px, 6vw, 84px) clamp(24px, 5vw, 64px)"
      : "clamp(32px, 5vw, 64px) clamp(22px, 4vw, 52px)";
  const keepsRadius = profile.borderRadius !== "0px" && profile.borderRadius !== "";
  const fullBleed = target.bounds.width > window.innerWidth * 0.92 && !keepsRadius;

  return [
    op(targetSel, {
      boxSizing: "border-box",
      isolation: "isolate",
      padding: basePadding,
      color: context.textColor,
      fontFamily: context.fontFamily,
      background:
        profile.background === "rgba(0, 0, 0, 0)" || profile.background === "transparent"
          ? context.surfaceColor
          : context.pageBackground,
      ...(fullBleed
        ? {
            borderTop: `1px solid ${context.borderColor}`,
            borderBottom: `1px solid ${context.borderColor}`
          }
        : {}),
      borderRadius: keepsRadius
        ? profile.borderRadius
        : profile.isCompact
          ? context.cardRadius
          : "0",
      boxShadow: "none"
    }),
    op(descendant(target, "h1,h2,h3"), {
      maxWidth: "min(860px, 100%)",
      margin: "0",
      letterSpacing: "-0.01em",
      lineHeight: "1.06",
      textWrap: "balance",
      fontWeight: "750"
    }),
    op(descendant(target, "p,li"), {
      maxWidth: "68ch",
      lineHeight: "1.65",
      color: context.mutedColor,
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

function signatureRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  const targetSel = targetSelector(target);
  const keepLayout = profile.columnCount > 1 || profile.isDense || !profile.isHero;
  return [
    ...baseOperations(target, profile, push, context),
    op(targetSel, {
      ...(keepLayout
        ? {}
        : {
            display: "grid",
            gridTemplateColumns: profile.hasMedia
              ? "minmax(0, 1.08fr) minmax(280px, 0.92fr)"
              : "minmax(0, 1fr)"
          }),
      alignItems: "center",
      gap: push ? "clamp(28px, 5vw, 64px)" : "clamp(24px, 4vw, 48px)",
      background: `linear-gradient(180deg, ${context.surfaceColor} 0%, color-mix(in oklch, ${context.surfaceColor} 86%, ${context.pageBackground}) 54%, ${context.pageBackground} 100%)`,
      color: context.textColor
    }),
    op(descendant(target, "h1,h2"), {
      fontSize: profile.isCompact
        ? "clamp(26px, 5vw, 40px)"
        : "clamp(34px, 4.6vw, 60px)",
      maxWidth: "20ch"
    }),
    op(descendant(target, "p"), {
      color: context.mutedColor,
      fontSize: "clamp(16px, 1.5vw, 19px)"
    }),
    op(descendant(target, "a,button"), {
      borderRadius: profile.ctaRadius ?? "999px",
      padding: push ? "15px 28px" : "13px 23px",
      background: context.accentColor,
      color: context.buttonTextColor,
      border: `1px solid color-mix(in oklch, ${context.accentColor} 72%, ${context.textColor})`,
      boxShadow: `0 10px 26px color-mix(in oklch, ${context.accentColor} 22%, transparent)`,
      fontWeight: "700"
    }),
    op(descendant(target, "a + a,button + button,a ~ a,button ~ button"), {
      background: "transparent",
      color: context.textColor,
      boxShadow: "none",
      border: `1px solid color-mix(in oklch, ${context.textColor} 26%, transparent)`
    })
  ];
}

function productRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  const targetSel = targetSelector(target);
  return [
    ...baseOperations(target, profile, push, context),
    op(targetSel, {
      background: context.surfaceColor,
      color: context.textColor,
      borderTop: `1px solid ${context.borderColor}`,
      borderBottom: `1px solid ${context.borderColor}`
    }),
    op(descendant(target, "article,li,.card,[class*='card'],[class*='Card']"), {
      background: "transparent",
      border: "0",
      borderTop: `1px solid ${context.borderColor}`,
      borderRadius: "0",
      boxShadow: "none",
      padding: push ? "24px 0" : "20px 0"
    }),
    op(descendant(target, "h1,h2,h3"), {
      color: context.textColor,
      fontWeight: "720"
    }),
    op(descendant(target, "p,li,span"), {
      color: context.mutedColor
    }),
    op(descendant(target, "a,button"), {
      borderRadius: "8px",
      background: context.textColor,
      color: context.buttonTextColor,
      border: `1px solid ${context.textColor}`,
      boxShadow: "none"
    })
  ];
}

function editorialRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  const targetSel = targetSelector(target);
  return [
    ...baseOperations(target, profile, push, context),
    op(targetSel, {
      display: "grid",
      gridTemplateColumns: profile.isCompact ? "1fr" : "minmax(0, 0.74fr) minmax(240px, 0.26fr)",
      gap: push ? "clamp(24px, 7vw, 88px)" : "clamp(22px, 5vw, 64px)",
      alignItems: "start",
      background: `color-mix(in oklch, ${context.surfaceColor} 92%, ${context.pageBackground})`,
      color: context.textColor
    }),
    op(descendant(target, "h1,h2"), {
      fontSize: profile.isCompact
        ? "clamp(28px, 5vw, 44px)"
        : "clamp(38px, 5vw, 64px)",
      lineHeight: "1.02",
      maxWidth: "16ch",
      fontWeight: "800"
    }),
    op(descendant(target, "p"), {
      fontSize: "clamp(16px, 1.4vw, 19px)",
      color: context.mutedColor
    }),
    op(descendant(target, "img,video,picture,canvas"), {
      borderRadius: "0",
      aspectRatio: "4 / 3",
      objectFit: "cover",
      filter: "saturate(0.92) contrast(1.04)"
    })
  ];
}

function systemRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push, context),
    op(targetSelector(target), {
      background: context.surfaceColor,
      color: context.textColor,
      border: `1px solid ${context.borderColor}`,
      borderRadius: profile.isCompact ? context.radius : context.cardRadius,
      boxShadow: context.shadow
    }),
    op(descendant(target, "h1,h2,h3"), {
      fontWeight: "700",
      color: context.textColor
    }),
    op(descendant(target, "p,li,span"), {
      color: context.mutedColor
    }),
    op(descendant(target, "a,button,input,select,textarea"), {
      borderRadius: context.radius,
      border: `1px solid ${context.borderColor}`,
      boxShadow: `0 1px 0 color-mix(in oklch, ${context.textColor} 6%, transparent)`
    })
  ];
}

function spacingRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push, context),
    op(descendant(target, "* + *"), {
      marginTop: push ? "clamp(18px, 2vw, 30px)" : "clamp(14px, 1.6vw, 24px)"
    }),
    op(descendant(target, "h1 + *,h2 + *,h3 + *"), {
      marginTop: "clamp(16px, 2vw, 28px)"
    })
  ];
}

function ctaRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push, context),
    op(descendant(target, "a,button"), {
      borderRadius: "999px",
      padding: push ? "16px 30px" : "14px 24px",
      background: context.accentColor,
      color: context.buttonTextColor,
      border: `1px solid ${context.accentColor}`,
      boxShadow: `0 16px 34px color-mix(in oklch, ${context.accentColor} 20%, transparent)`,
      fontWeight: "780"
    }),
    op(descendant(target, "a + a,button + button"), {
      background: "transparent",
      color: context.textColor,
      boxShadow: "none",
      border: `1px solid ${context.borderColor}`
    })
  ];
}

function cardsRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push, context),
    op(descendant(target, "article,li,.card,[class*='card'],[class*='Card']"), {
      background: context.surfaceColor,
      border: `1px solid ${context.borderColor}`,
      borderRadius: push ? context.cardRadius : context.radius,
      boxShadow: "none",
      padding: push ? "26px" : "22px"
    }),
    op(descendant(target, "article:nth-child(2n),li:nth-child(2n),.card:nth-child(2n)"), {
      transform: profile.isCompact ? "none" : "translateY(10px)"
    })
  ];
}

function darkRecipe(
  target: TargetInfo,
  profile: TargetProfile,
  push: boolean,
  context: RecipeContext
): VisualOperation[] {
  return [
    ...baseOperations(target, profile, push, context),
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
      background: context.aiPaletteRisk ? "#d8b84c" : "color-mix(in oklch, #f3c744 82%, " + context.accentColor + ")",
      color: "#151a20",
      border: "1px solid rgba(243, 199, 68, 0.82)",
      boxShadow: "0 14px 30px rgba(0, 0, 0, 0.24)"
    })
  ];
}

export function createRecipe(
  goal: string,
  target: TargetInfo,
  intensity = 1,
  designDna?: PageDesignDna
): RecipeResult {
  const textResult = textRecipe(goal, target);
  if (textResult) return textResult;

  const recipe = chooseRecipe(goal);
  const profile = inspectTarget(target);
  const push = intensity > 1;
  const context = contextFor(designDna, profile);
  const recipes: Record<string, () => VisualOperation[]> = {
    signature: () => signatureRecipe(target, profile, push, context),
    product: () => productRecipe(target, profile, push, context),
    editorial: () => editorialRecipe(target, profile, push, context),
    system: () => systemRecipe(target, profile, push, context),
    spacing: () => spacingRecipe(target, profile, push, context),
    cta: () => ctaRecipe(target, profile, push, context),
    cards: () => cardsRecipe(target, profile, push, context),
    dark: () => darkRecipe(target, profile, push, context)
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
