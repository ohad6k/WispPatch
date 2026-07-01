# WispPatch Design System

> Category: Developer Tool
> Local visual patching assistant. Warm, precise, craft-focused, and source-safe.

## 1. Visual Theme and Atmosphere

WispPatch should feel like a small expert design instrument, not a generic AI dashboard. The interface is calm, local, and inspection-focused, with the Wisp mascot adding warmth only where it helps the workflow.

Use a light editorial-product base by default. Prefer quiet surfaces, sharp hierarchy, and purposeful negative space. Avoid purple-blue AI gradients, neon effects, decorative blobs, and generic card-heavy layouts.

## 2. Color

Core palette:

- Ink: `#151a20`
- Charcoal: `#17202b`
- Paper: `#fbfaf7`
- Soft surface: `#f4f1e9`
- Mist: `#eef3f0`
- Line: `#dfe4df`
- Wisp gold: `#f7bd00`
- Warm accent: `#d49a3a`
- Success green: `#2e7d32`
- Error red: `#b42318`

Rules:

- Use Wisp gold as the primary accent, not as a full-page wash.
- Keep accents singular per view.
- Use warm neutrals for product/marketing surfaces and neutral grays for dense tool surfaces.
- Do not use purple-blue gradients unless a target app's brand contract explicitly requires them.

## 3. Typography

Default stack:

- Product UI: `Geist`, `Satoshi`, `Aptos`, `Segoe UI`, sans-serif
- Technical labels and paths: `JetBrains Mono`, `SFMono-Regular`, `Consolas`, monospace

Rules:

- Headings should be confident but not oversized inside tool panels.
- Use letter spacing `0` for normal UI text.
- Use mono only for paths, code, selectors, coordinates, and compact metadata.
- Do not default to Inter for Wisp-owned surfaces.

## 4. Spacing and Layout

Use an 8px spacing rhythm:

- Tight inline gaps: `8px`
- Controls: `12px` to `16px`
- Panels: `18px` to `24px`
- Section padding: `40px` to `88px`

Layout rules:

- Prefer CSS Grid for target-aware layout changes.
- Wide hero-like targets can use asymmetric grids.
- Dense app surfaces should use separators and grouping before adding cards.
- Mobile layouts must collapse to a clean single column without horizontal overflow.
- Fixed-format controls need stable dimensions so labels, icons, and hover states do not shift layout.

## 5. Components

Buttons:

- Minimum hit target: `44px`.
- Primary buttons use ink or Wisp gold depending on contrast.
- Border radius should usually be `8px` to `12px`; pill buttons are reserved for clear primary CTAs.
- Always include hover, active, focus-visible, disabled, and loading considerations when a source implementation changes controls.

Panels:

- Use cards for repeated items, modals, and framed tools only.
- Avoid cards inside cards.
- Tool panels should be compact, readable, and anchored to the selected target.

Review artifacts:

- Screenshots are the primary proof.
- `visualpatch.json`, `design-brief.md`, `design-analysis.md`, `design-gate.md`, and `implement.md` are part of one contract.

## 6. Motion

Motion should make the Wisp feel alive without making the product feel unserious.

Rules:

- Animate `transform` and `opacity`.
- Use `cubic-bezier(0.16, 1, 0.3, 1)` for UI transitions.
- Keep target patches reversible and avoid layout-shifting motion.
- Wisp flight can be playful; source-code patch previews should stay restrained.
- Respect reduced motion when adding larger animation features.

## 7. Voice and Copy

Voice:

- Direct
- Useful
- Calm
- Craft-focused

Use concrete labels:

- Good: `Design pass ready. Lock it in?`
- Good: `Target analysis used`
- Avoid: `Unleash`, `Elevate`, `Next-gen`, `AI-powered magic`

Avoid fake proof, fake metrics, fake quotes, and fake product claims.

## 8. Brand and Assets

Wisp is the brand signal. Use the provided mascot assets when the user is interacting with Wisp itself. Do not use the mascot as generic decoration inside exported target app designs unless the target app is WispPatch.

Asset priority:

1. Real target app assets and screenshots
2. Target app design tokens and components
3. Wisp mascot assets for Wisp-owned UI only
4. Honest placeholders when real assets are missing

## 9. Anti-Patterns

Never ship:

- Generic three-column feature rows as the default design answer
- Purple-blue AI gradients without brand evidence
- Decorative blobs, orbs, neon glows, or fake glass effects
- Fake metrics, fake testimonials, fake people, or fake brand claims
- SVG hero illustrations standing in for real product or brand media
- Oversized hero type inside compact app panels
- Rounded card spam for dense dashboards
- Unrelated rewrites of backend logic, auth, billing, routes, data fetching, or provider configuration

## 10. Quality Gate

A WispPatch-owned UI change is acceptable only when:

- It respects this `DESIGN.md`.
- It keeps the workflow local-first and source-safe.
- It has a clear design direction.
- It avoids the anti-pattern list above.
- It preserves or improves target selection, preview, export, and review ergonomics.
- It passes TypeScript and build verification.
