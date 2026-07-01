import { getElementLabel, getStableSelector } from "./selectors";
import type { TargetInfo } from "./types";

type PickerCallbacks = {
  onHover: (bounds: DOMRect | null, pointer: { x: number; y: number } | null) => void;
  onSelect: (target: TargetInfo) => void;
  canSelect?: () => boolean;
};

const MIN_AREA = 520;

function isOverlayElement(element: Element): boolean {
  return Boolean(element.closest("#wisppatch-root"));
}

function isOverlayEvent(event: Event): boolean {
  return event.composedPath().some((entry) => {
    return entry instanceof Element && entry.id === "wisppatch-root";
  });
}

function scoreCandidate(element: Element, depth: number): number {
  const rect = element.getBoundingClientRect();
  if (rect.width * rect.height < MIN_AREA) return -1;
  if (rect.width < 18 || rect.height < 16) return -1;

  const tag = element.tagName.toLowerCase();
  const semanticScores: Record<string, number> = {
    button: 320,
    a: 300,
    input: 260,
    textarea: 260,
    select: 250,
    article: 280,
    section: 170,
    header: 210,
    nav: 180,
    footer: 180,
    main: 70
  };
  const semantic = semanticScores[tag] || 0;
  const role = element.hasAttribute("role") ? 150 : 0;
  const classHint = /hero|card|feature|pricing|section|panel|button|cta|nav|tab/i.test(
    element.className.toString()
  )
    ? 90
    : 0;
  const smallTargetBonus = rect.width < 220 && rect.height < 80 ? 80 : 0;
  const area = rect.width * rect.height;
  const size = Math.min(area, 120000) / 22000;
  const largeParentPenalty = area > 180000 || rect.width > 900 ? 78 : 0;
  return semantic + role + classHint + smallTargetBonus + size - largeParentPenalty - depth * 24;
}

function findCandidate(start: Element | null): Element | null {
  if (!start || isOverlayElement(start)) return null;

  const preferredCard = start.closest("article, li, [role='article'], .card, [class*='card']");
  if (preferredCard && !isOverlayElement(preferredCard)) {
    const rect = preferredCard.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area >= MIN_AREA && area < window.innerWidth * window.innerHeight * 0.55) {
      return preferredCard;
    }
  }

  let current: Element | null = start;
  let best: Element | null = null;
  let bestScore = -1;
  let depth = 0;

  while (current && current !== document.body && current !== document.documentElement) {
    const score = scoreCandidate(current, depth);
    if (score > bestScore) {
      best = current;
      bestScore = score;
    }
    current = current.parentElement;
    depth += 1;
  }

  return best;
}

export function createTargetPicker(callbacks: PickerCallbacks): { start: () => void; stop: () => void } {
  let active = false;
  let currentCandidate: Element | null = null;

  const onPointerMove = (event: PointerEvent): void => {
    if (!active) return;
    const candidate = findCandidate(event.target as Element | null);
    currentCandidate = candidate;
    callbacks.onHover(candidate ? candidate.getBoundingClientRect() : null, {
      x: event.clientX,
      y: event.clientY
    });
  };

  const onClick = (event: MouseEvent): void => {
    if (!active || isOverlayEvent(event) || callbacks.canSelect?.() === false) return;

    const candidate = findCandidate(event.target as Element | null) || currentCandidate;
    if (!candidate) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = candidate.getBoundingClientRect();
    callbacks.onSelect({
      label: getElementLabel(candidate),
      selector: getStableSelector(candidate),
      bounds: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    });
  };

  return {
    start() {
      if (active) return;
      active = true;
      document.addEventListener("pointermove", onPointerMove, true);
      document.addEventListener("click", onClick, true);
    },
    stop() {
      active = false;
      currentCandidate = null;
      callbacks.onHover(null, null);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onClick, true);
    }
  };
}
