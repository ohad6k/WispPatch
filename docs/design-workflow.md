# Wisp Design Workflow

WispPatch turns a visual approval session into an implementation brief. This document defines the built-in design workflow that should guide every exported `design-brief.md`, `design-brief.json`, `design-analysis.md`, `design-analysis.json`, `design-directions.md`, `design-directions.json`, `design-gate.md`, `design-gate.json`, and `implement.md`.

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
- `design-directions.md`: target-aware design routes that encode the Wisp loop's variation step before source edits
- `design-directions.json`: the same direction map in a machine-readable form for future automation
- `design-gate.md`: the scorecard an implementing agent must complete before claiming the patch is done
- `design-gate.json`: the same gate in a machine-readable form for future automation
- local brand or product assets when available
- `DESIGN.md`, brand docs, style guides, or component-library docs when the target app has them
- WispPatch's own root `DESIGN.md` when changing Wisp-owned UI, docs, recipes, or review artifacts
- the target app's existing components, design tokens, routes, and CSS patterns

## Agent Loop

1. Read `design-brief.md`, `design-analysis.md`, `design-directions.md`, and `design-gate.md`; list the completion gates that apply.
2. Use `design-analysis.md` to understand the selected target's structure, assets, controls, density, and risks.
3. Choose one route from `design-directions.md`, or write the stronger evidence that supersedes the route map.
4. Read the target app structure before editing.
5. Open `before.png` and `after.png`; identify the concrete visual delta.
6. Load relevant design guidance or skills before writing UI code.
7. If the app has a `DESIGN.md` or equivalent brand contract, treat it as binding.
8. Prefer existing design tokens, component APIs, and layout primitives.
9. Implement only the files needed to match the approved target.
10. Run the app and compare the result against `after.png`.
11. Score the result against the design brief rubric.
12. Complete every required check in `design-gate.md`.
13. Iterate once if any score is below 8/10, or document the blocker with evidence.
14. Check at least one mobile viewport and one desktop viewport.
15. Run the project's normal typecheck, lint, build, or test command.

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

- Open Design pattern: readable design contracts, reusable skills, templates, sandbox preview, critique before handoff.
- design-taste-frontend pattern: high-variance layout, calibrated palette, anti-card-overuse, real states, motion through transform and opacity.
- Huashu pattern: context and asset discovery first, assumptions before polish, variations when direction is weak, critique across philosophy alignment, hierarchy, craft, functionality, and originality.
- User Wisp loop: assets plus goal, target analysis, direction map, visual target, iteration until similar, then implementation.

The runtime overlay mirrors the same loop with target-aware design passes. Quick actions such as Signature polish, Design system, Editorial layout, and CTA focus are only direction locks; the exported brief still requires the implementing agent to study the real app, reuse its assets and tokens, and prove the result against the approved screenshot.

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

## VisualPatch Acceptance

An implementation is complete when:

- the source app visually matches the approved `after.png` direction
- any existing `DESIGN.md`, brand guide, or component contract is respected
- `design-gate.md` required checks are completed with evidence
- `design-analysis.md` findings are used or explicitly superseded by stronger source-code evidence
- `design-directions.md` is used to choose or justify the implementation route
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
