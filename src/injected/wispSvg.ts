function rigSvg(idSuffix: string): string {
  const goldId = `wpWispGold-${idSuffix}`;
  const tailId = `wpWispTail-${idSuffix}`;
  const edgeId = `wpWispEdge-${idSuffix}`;
  const glowId = `wpWispSoftGlow-${idSuffix}`;
  const bloomId = `wpWispBloom-${idSuffix}`;
  const eyeId = `wpWispEye-${idSuffix}`;
  return `
    <svg class="wp-wisp-rig-svg" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <radialGradient id="${goldId}" cx="36%" cy="18%" r="86%">
          <stop offset="0" stop-color="#fffce0" />
          <stop offset="0.22" stop-color="#ffef8a" />
          <stop offset="0.52" stop-color="#ffd400" />
          <stop offset="0.82" stop-color="#f2b300" />
          <stop offset="1" stop-color="#d99500" />
        </radialGradient>
        <linearGradient id="${tailId}" x1="80" y1="86" x2="80" y2="156" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffd400" />
          <stop offset="0.7" stop-color="#ffc400" stop-opacity="0.92" />
          <stop offset="1" stop-color="#ffb800" stop-opacity="0.55" />
        </linearGradient>
        <linearGradient id="${edgeId}" x1="34" y1="10" x2="126" y2="150">
          <stop offset="0" stop-color="#fffbc4" />
          <stop offset="0.55" stop-color="#ffd83d" />
          <stop offset="1" stop-color="#eda300" />
        </linearGradient>
        <filter id="${glowId}" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="${bloomId}" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="${eyeId}" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse class="wp-wisp-ground" cx="80" cy="148" rx="42" ry="8" />

      <g class="wp-wisp-aura">
        <path
          d="M80 16c28 0 45 23 45 54 0 26-4 46-1 66-10-6-19-7-26 4-6-12-13-13-19 0-6-12-14-13-21-2-8-9-17-10-28-3 5-17 12-36 12-63C42 39 55 16 80 16Z"
          filter="url(#${bloomId})"
        />
      </g>

      <g class="wp-wisp-trail-rig">
        <path class="is-t1" d="M20 84c18 8 37 6 56-6" />
        <path class="is-t2" d="M12 102c24 8 50 4 76-12" />
        <path class="is-t3" d="M30 120c18 5 35 2 51-8" />
      </g>

      <g class="wp-wisp-character">
        <g class="wp-wisp-tail">
          <path class="wp-wisp-tail-feather is-left" d="M36 106c-4 14-12 24-26 31 16 2 29-6 37-21Z" fill="url(#${tailId})" />
          <path class="wp-wisp-tail-feather is-mid" d="M60 120c-3 14-9 25-20 33 15 0 26-9 33-25Z" fill="url(#${tailId})" />
          <path class="wp-wisp-tail-feather is-right" d="M96 122c2 13 8 23 19 30-14 1-25-6-32-20Z" fill="url(#${tailId})" />
        </g>

        <path
          class="wp-wisp-body-core"
          d="M80 12c29 0 46 24 46 56 0 15-2 27-3 39-1 10 0 19 3 29-11-7-20-8-27 5-6-13-14-14-21 1-6-14-15-15-22-2-8-10-18-11-31-4 4-11 6-21 5-31-1-13-4-24-4-37C26 36 50 12 80 12Z"
          fill="url(#${goldId})"
          filter="url(#${glowId})"
        />
        <path
          class="wp-wisp-body-edge"
          d="M80 12c29 0 46 24 46 56 0 15-2 27-3 39-1 10 0 19 3 29-11-7-20-8-27 5-6-13-14-14-21 1-6-14-15-15-22-2-8-10-18-11-31-4 4-11 6-21 5-31-1-13-4-24-4-37C26 36 50 12 80 12Z"
          stroke="url(#${edgeId})"
        />

        <g class="wp-wisp-gloss">
          <ellipse cx="60" cy="34" rx="24" ry="12" transform="rotate(-16 60 34)" />
          <circle cx="103" cy="28" r="5.5" />
          <ellipse class="is-belly" cx="80" cy="92" rx="30" ry="20" />
        </g>

        <g class="wp-wisp-arm is-left">
          <path d="M40 82c-9 3-15 10-17 20 9-1 16-7 20-16 1-3-1-5-3-4Z" />
        </g>
        <g class="wp-wisp-arm is-right">
          <path d="M120 82c9 3 15 10 17 20-9-1-16-7-20-16-1-3 1-5 3-4Z" />
        </g>

        <g class="wp-wisp-face-rig">
          <g class="wp-wisp-eyes" filter="url(#${eyeId})">
            <path class="wp-wisp-eye-rig is-left" d="M46 58l20 7c2 6-2 11-9 10.5-8-0.5-13-8-11-17.5Z" />
            <path class="wp-wisp-eye-rig is-right" d="M114 58l-20 7c-2 6 2 11 9 10.5 8-0.5 13-8 11-17.5Z" />
          </g>
          <path class="wp-wisp-mouth-rig" d="M67 86c9 8 19 8 28-2" />
        </g>

        <g class="wp-wisp-card-rig">
          <rect x="106" y="78" width="38" height="28" rx="4" transform="rotate(8 125 92)" />
          <path class="is-line" d="M113 88l24 3.4" transform="rotate(8 125 92)" />
          <path class="is-chart" d="M113 99l8-4 6 3 9-7" transform="rotate(8 125 92)" />
          <path class="is-star" d="M140 74l1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6Z" />
        </g>
      </g>

      <g class="wp-wisp-scan-rig">
        <ellipse class="is-r1" cx="80" cy="122" rx="36" ry="11" />
        <ellipse class="is-r2" cx="80" cy="122" rx="22" ry="6.5" />
        <ellipse class="is-r3" cx="80" cy="122" rx="9" ry="2.6" />
      </g>

      <g class="wp-wisp-sparks-rig">
        <path class="wp-wisp-spark is-a" d="M128 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
        <path class="wp-wisp-spark is-b" d="M26 46l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <path class="wp-wisp-spark is-c" d="M124 112l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <path class="wp-wisp-spark is-d" d="M40 22l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z" />
      </g>
    </svg>
  `;
}

export function createWispSprite(size: "stage" | "mini" = "stage"): string {
  return `<span class="wp-wisp-rig wp-wisp-rig-${size}">${rigSvg(size)}</span>`;
}

export function createWispSvg(): string {
  return rigSvg("main");
}
