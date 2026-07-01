# Wisp Design Workflow

WispPatch turns a visual approval session into an implementation brief. This document defines the built-in design workflow that should guide every exported `design-brief.md`, `design-brief.json`, `design-analysis.md`, `design-analysis.json`, `design-dna.md`, `design-dna.json`, `design-assets.md`, `design-assets.json`, `design-system.md`, `design-system.json`, `design-iterations.md`, `design-iterations.json`, `design-directions.md`, `design-directions.json`, `design-critique.md`, `design-critique.json`, `design-verification.md`, `design-verification.json`, `design-gate.md`, `design-gate.json`, and `implement.md`.

## Design Contract

The approved `after.png` is the visual target. The temporary operations in `visualpatch.json` are hints, not a demand to copy injected CSS line-for-line. A coding agent should implement the smallest real source-code change that recreates the approved direction while preserving the app.

This workflow is inspired by agent-native design tools such as Open Design, especially the idea that design quality should come from readable files an agent can apply: skills for taste, design-system contracts for brand rules, templates for artifact shape, and a critique loop before handoff.

Use these inputs together:

- `before.png`: the original page state
- `after.png`: the approved visual target
- `visualpatch.json`: goal, viewport, target selector, bounds, recipe, operations, and acceptance criteria
- `design-brief.md`: the Wisp design workflow, skill stack, critique rubric, and completion gates
- `design-brief.json`: the same contract in a machine-readable form for future automation
- `design-analysis.md`: before/after target context including DOM structure, density, media, controls, computed visual styles, design signals, and risks
- `design-analysis.json`: the same target context in a machine-readable form for future automation
- `design-dna.md`: page-level design system capture including colors, fonts, spacing, radii, shadows, assets, component signals, framework hints, and risks
- `design-dna.json`: the same page design DNA in a machine-readable form for future automation
- `design-assets.md`: real-assets-first registry with captured assets, quality scores, missing logo/product/UI needs, and placeholder rules
- `design-assets.json`: the same asset registry in a machine-readable form for future automation
- `design-system.md`: reusable DESIGN.md-style contract distilled from captured DNA, with token, asset, component, and anti-slop rules
- `design-system.json`: the same reusable design-system contract in a machine-readable form for future automation
- `design-iterations.md`: Wisp loop history showing which passes were tried, pushed, refined, undone, and accepted
- `design-iterations.json`: the same iteration history in a machine-readable form for future automation
- `design-directions.md`: target-aware design routes that encode the Wisp loop's variation step before source edits
- `design-directions.json`: the same direction map in a machine-readable form for future automation
- `design-critique.md`: automatic preflight scores, hard fails, and quick wins derived from the approved target context
- `design-critique.json`: the same critique in a machine-readable form for future automation
- `design-verification.md`: automated browser proof for screenshot validity, target visibility, desktop/mobile overflow, context artifacts, iteration history, and critique status
- `design-verification.json`: the same browser verification in a machine-readable form for future automation
- `design-gate.md`: the scorecard an implementing agent must complete before claiming the patch is done
- `design-gate.json`: the same gate in a machine-readable form for future automation
- local brand or product assets when available
- `DESIGN.md`, brand docs, style guides, or component-library docs when the target app has them
- WispPatch's own root `DESIGN.md` when changing Wisp-owned UI, docs, recipes, or review artifacts
- the target app's existing components, design tokens, routes, and CSS patterns

## Agent Loop

1. Read `design-brief.md`, `design-analysis.md`, `design-dna.md`, `design-assets.md`, `design-system.md`, `design-iterations.md`, `design-directions.md`, `design-critique.md`, `design-verification.md`, and `design-gate.md`; list the completion gates that apply.
2. Use `design-analysis.md` to understand the selected target's structure, assets, controls, density, and risks.
3. Use `design-dna.md` to understand the surrounding page's colors, fonts, spacing, real assets, component patterns, and system-level risks.
4. Use `design-assets.md` to decide which real assets can be reused, which asset needs are missing, and where honest placeholders are required.
5. Use `design-system.md` as the reusable contract for token, asset, component, and anti-slop decisions.
6. Use `design-iterations.md` to identify the accepted Wisp pass and avoid implementing undone or rejected routes.
7. Choose one route from `design-directions.md`, or write the stronger evidence that supersedes the route map.
8. Read `design-critique.md`; resolve, supersede, or document every hard fail and quick win.
9. Read `design-verification.md`; resolve or document any failed exported-artifact checks.
10. Read the target app structure before editing.
11. Open `before.png` and `after.png`; identify the concrete visual delta.
12. Load relevant design guidance or skills before writing UI code.
13. If the app has a `DESIGN.md` or equivalent brand contract, treat it as binding.
14. Prefer existing design tokens, component APIs, and layout primitives.
15. Implement only the files needed to match the approved target.
16. Run the app and compare the result against `after.png`.
17. Score the result against the design brief rubric.
18. Complete every required check in `design-gate.md`.
19. Iterate once if any score is below 8/10, or document the blocker with evidence.
20. Check at least one mobile viewport and one desktop viewport.
21. Run the project's normal typecheck, lint, build, or test command.

## Wisp Runtime Learning Loop

Wisp should improve from correction cycles. Feedback is not cosmetic; repeated misses become product constraints:

- Intent classification comes first. Text-edit prompts create reversible text operations. Visual-design prompts create visual recipes. Never turn `change Account notes to Account` into a layout redesign.
- Approval is conversational. After `Lock It In`, `Try Again`, `Push Further`, and `Undo`, Wisp must also offer a way back to chat so the user can refine the current target.
- The mascot is a character. It should fly to the selected thing, inspect it, then face the user while waiting for direction.
- Speech UI belongs above/right of Wisp, with a tail back toward the character. The mascot must not cover the chat bubble or action controls.
- The Wisp face is part of the product signal. Eye/mouth overlays must remain aligned with each pose and readable over transparent yellow assets.
- Manga UI fidelity is a rule, not a suggestion: inked borders, angular strips, gold accents, halftone texture, and strong button silhouettes should guide chat, chips, and approval actions.
- Every correction should be verified in the running browser with screenshots or geometry checks, then encoded in runtime logic or this workflow.

## Built-In Skill Stack

Every Wisp design brief converts these workflows into explicit gates:

- Open Design pattern: readable design contracts, reusable skills, reusable design systems, templates, sandbox preview, critique before handoff.
- design-taste-frontend pattern: high-variance layout, calibrated palette, anti-card-overuse, real states, motion through transform and opacity.
- Huashu pattern: context and asset discovery first, real assets or honest placeholders, assumptions before polish, variations when direction is weak, critique across philosophy alignment, hierarchy, craft, functionality, and originality.
- User Wisp loop: assets plus goal, target analysis, direction map, automatic critique, visual target, iteration until similar, then implementation.

The runtime overlay mirrors the same loop with target-aware design passes. Quick actions such as Signature polish, Design system, Editorial layout, and CTA focus are only direction locks; the exported brief still requires the implementing agent to study the real app, reuse its assets and tokens, classify missing asset needs, and prove the result against the approved screenshot.

## Quality Bar

The implementation should feel designed, not generated. Favor:

- a clear brand contract before layout decisions
- clear hierarchy with restrained type scale
- one intentional accent color
- asymmetric or editorial spacing when appropriate
- responsive grid/layout primitives instead of fragile flex math
- real interaction states: loading, empty, error, hover, active, disabled
- precise copy tied to the product domain
- visual density that matches the app type
- motion through transform and opacity only

Avoid:

- generic three-card feature rows
- purple-blue AI gradients by default
- neon glows and decorative blobs
- fake names, fake metrics, and vague startup copy
- oversized headings inside compact panels
- unrelated page rewrites
- changing backend logic, auth, billing, routes, provider config, or data fetching

## Responsive Verification

A patch is not accepted until it works across common viewport widths. The agent should check:

- the selected target does not overflow horizontally
- text fits inside buttons, panels, cards, and headings
- fixed-format UI elements keep stable dimensions
- mobile layouts collapse to a clean single column where needed
- dynamic states do not shift layout unexpectedly

## Demo QA

Run `npm run build` and `npm run qa:demo` before release changes that touch the overlay, bridge, export artifacts, or design critique. The QA flow launches the bundled demo in headless Chromium, selects the hero, applies the signature route, retries into another direction, pushes the accepted direction, exports the patch, and verifies the expected artifacts exist.

## VisualPatch Acceptance

An implementation is complete when:

- the source app visually matches the approved `after.png` direction
- any existing `DESIGN.md`, brand guide, or component contract is respected
- `design-gate.md` required checks are completed with evidence
- `design-analysis.md` findings are used or explicitly superseded by stronger source-code evidence
- `design-dna.md` findings are used or explicitly superseded by stronger source-code evidence
- `design-assets.md` findings are used or missing real-asset needs are resolved, honestly placeholdered, or documented
- `design-system.md` token, asset, component, and anti-slop rules are used or explicitly superseded by stronger source-code evidence
- `design-iterations.md` accepted pass and rejected routes are accounted for
- `design-directions.md` is used to choose or justify the implementation route
- `design-critique.md` hard fails and quick wins are resolved, superseded, or documented
- `design-verification.md` passes or any failed exported-artifact checks are resolved, superseded, or documented
- the selected target still behaves correctly
- surrounding page sections remain intact
- the app remains responsive
- project verification commands pass
- the critique rubric is scored and every dimension is at least 8/10, or the blocker is documented with evidence
- the final diff is scoped to the approved visual change

## Inspiration References

- Open Design: https://github.com/nexu-io/open-design
  - local-first agentic design workspace
  - skills plus design systems plus plugins as plain files
  - `DESIGN.md` as a brand contract that shapes generated artifacts
  - sandboxed previews and artifact-first critique before handoff
