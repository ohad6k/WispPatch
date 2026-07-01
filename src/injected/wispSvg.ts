import { wispPoseSprites } from "./generated/wispPoseSprites";

const stageFrames = {
  idle: [wispPoseSprites.idle],
  targeting: [wispPoseSprites.idle],
  listening: [wispPoseSprites.listening],
  flying: [wispPoseSprites.flying],
  scanning: [wispPoseSprites.scanning],
  patching: [wispPoseSprites.patching],
  presenting: [wispPoseSprites.presenting],
  success: [wispPoseSprites.success]
} as const;

export type WispSpriteState = keyof typeof stageFrames;

export const wispFrameCounts = Object.fromEntries(
  Object.entries(stageFrames).map(([state, frames]) => [state, frames.length])
) as Record<WispSpriteState, number>;

export function createWispSprite(size: "stage" | "mini" = "stage"): string {
  const images = Object.entries(stageFrames)
    .flatMap(([state, frames]) =>
      frames.map(
        (src, index) =>
          `<img class="wp-wisp-sprite wp-wisp-${state}-${index}" data-sprite-state="${state}" data-frame="${index}" src="${src}" alt="" />`
      )
    )
    .join("");

  return `<span class="wp-wisp-sprite-stack wp-wisp-sprite-stack-${size}">${images}<span class="wp-wisp-face" aria-hidden="true"><span class="wp-wisp-eye wp-wisp-eye-left"></span><span class="wp-wisp-eye wp-wisp-eye-right"></span><span class="wp-wisp-mouth"></span></span></span>`;
}

export function createWispSvg(idSuffix = "main"): string {
  const glowId = `wpWispGlow-${idSuffix}`;
  const edgeId = `wpWispEdge-${idSuffix}`;
  const bloomId = `wpWispBloom-${idSuffix}`;
  return `
    <svg viewBox="0 0 160 160" aria-hidden="true" class="wp-wisp-svg">
      <defs>
        <radialGradient id="${glowId}" cx="36%" cy="22%" r="76%">
          <stop offset="0" stop-color="#fffbd1" />
          <stop offset="0.32" stop-color="#ffe86a" />
          <stop offset="0.68" stop-color="#ffd000" />
          <stop offset="1" stop-color="#d49800" />
        </radialGradient>
        <linearGradient id="${edgeId}" x1="32" y1="10" x2="124" y2="144">
          <stop offset="0" stop-color="#fff8a8" />
          <stop offset="1" stop-color="#f2a900" />
        </linearGradient>
        <filter id="${bloomId}" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="79" cy="144" rx="43" ry="10" fill="rgba(247, 188, 0, 0.24)" />
      <path d="M24 131c26-5 44-15 58-33 15-20 33-28 58-28-18 16-27 35-28 57-20-9-34-6-44 8-11-12-25-13-44-4Z" fill="#ffc400" opacity=".16" />
      <path
        d="M79 11c34 0 55 25 55 62 0 25-7 42-18 62-9-12-17-11-24 2-7-13-17-12-24 1-7-13-18-12-26 1-4-14-15-16-25-4-7-18-10-35-10-60C7 37 29 11 79 11Z"
        fill="url(#${glowId})"
        filter="url(#${bloomId})"
      />
      <path
        d="M79 11c34 0 55 25 55 62 0 25-7 42-18 62-9-12-17-11-24 2-7-13-17-12-24 1-7-13-18-12-26 1-4-14-15-16-25-4-7-18-10-35-10-60C7 37 29 11 79 11Z"
        fill="none"
        stroke="url(#${edgeId})"
        stroke-width="2.2"
        opacity=".9"
      />
      <path d="M48 76c-14 6-24 17-26 32 15-2 26-12 31-27" fill="#ffc400" opacity=".82" />
      <path d="M110 76c14 6 24 17 26 32-15-2-26-12-31-27" fill="#ffc400" opacity=".82" />
      <path d="M45 48c10-12 28-13 41-3" fill="none" stroke="#fff7b3" stroke-width="8" stroke-linecap="round" opacity=".54" />
      <path d="M42 70c11-6 22-6 32 0" fill="none" stroke="#221926" stroke-width="7" stroke-linecap="round" />
      <path d="M88 70c11-6 22-6 32 0" fill="none" stroke="#221926" stroke-width="7" stroke-linecap="round" />
      <path d="M70 94c8 8 19 8 27 0" fill="none" stroke="#221926" stroke-width="5" stroke-linecap="round" />
      <circle cx="128" cy="37" r="3" fill="#fff6a4" />
      <path d="M139 23l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#ffe66d" />
      <path d="M22 38l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#fff0a0" opacity=".9" />
    </svg>
  `;
}
