# WispPatch

![WispPatch mascot, motion states, and approval UI](assets/ChatGPT%20Image%20Jul%201,%202026,%2012_16_11%20PM%20(1).png)

Local visual UI patching with Wisp before source code changes.

[![Version](https://img.shields.io/badge/version-0.1.0-f7bd00?style=flat-square)](package.json)
[![Runtime](https://img.shields.io/badge/runtime-Node.js%2020-1f2937?style=flat-square)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square)](package.json)
[![Playwright](https://img.shields.io/badge/browser-Playwright-2e7d32?style=flat-square)](package.json)
[![Local Only](https://img.shields.io/badge/scope-local--only-111827?style=flat-square)](#safety-model)
[![License](https://img.shields.io/badge/license-not%20declared-lightgrey?style=flat-square)](#license)

WispPatch opens a local browser overlay on top of a running website. Click a section, tell Wisp what to change, preview a temporary visual or copy patch, then export before/after screenshots and a VisualPatch implementation prompt for a coding agent.

`v0.1.0` is a local-first MVP. It does not edit your repository, upload screenshots, require login, or call a hosted AI provider.

WispPatch's own product design contract lives in [DESIGN.md](DESIGN.md). Use it for Wisp-owned UI, docs, and future runtime design decisions.

**Contents**

[Quick Start](#quick-start) | [How It Works](#how-it-works) | [VisualPatch Export](#visualpatch-export) | [Built-In Design Loop](#built-in-design-loop) | [Safety Model](#safety-model) | [Roadmap](#roadmap)

## Wisp Design Skill

WispPatch has a design skill contract at the top of the project, not hidden in implementation details:

- [DESIGN.md](DESIGN.md) defines WispPatch's product taste, palette, typography, motion, component rules, and anti-patterns.
- [docs/design-workflow.md](docs/design-workflow.md) defines the agent workflow inspired by Open Design-style file contracts, frontend taste skills, critique gates, and the correction loop from this project.
- Runtime feedback becomes rules: text requests stay text-only, Wisp remains a character, chat stays available after approval, manga UI fidelity is enforced, and visual fixes require browser evidence.
- Exported briefs point future agents back to these rules so Wisp keeps learning from mistakes instead of repeating them.

## Quick Start

Clone or open the project, install dependencies, and build the CLI:

```powershell
npm install
npm run build
```

Run the included demo page:

```powershell
npm run demo
```

In another terminal, launch WispPatch against the demo:

```powershell
node dist/cli/index.js http://127.0.0.1:4177
```

Then:

1. Click a section in the browser.
2. Type a goal or choose a quick action.
3. Review Wisp's temporary visual patch.
4. Use `Lock It In` to export the proof package.

## How It Works

WispPatch is a small TypeScript CLI and injected browser overlay:

```text
wisppatch URL
  -> opens Chromium with Playwright
  -> injects Wisp into a Shadow DOM overlay
  -> lets you select a real page element
  -> applies reversible visual or text operations
  -> exports screenshots and implementation instructions
```

The current target-aware design passes cover:

- `Signature polish`
- `Design system`
- `Editorial layout`
- `CTA focus`
- typed goals such as spacing, dark mode, cleaner cards, product clarity, or brand polish
- simple text replacements such as `change Account notes to Account`

Each pass inspects the selected target before applying layout, typography, spacing, state, and accent decisions. The preview is still temporary: the durable source-code change happens later, when a coding agent implements the approved VisualPatch target inside the real app.

## VisualPatch Export

Approved patches are written to `.wisppatch/latest`:

| File | Purpose |
| --- | --- |
| `before.png` | Screenshot before Wisp applies the visual patch. |
| `after.png` | Screenshot after the approved temporary patch. |
| `visualpatch.json` | Machine-readable URL, viewport, target selector, bounds, goal, recipe, operations, and acceptance criteria. |
| `design-brief.json` | Machine-readable design contract for agents and future tooling. |
| `design-brief.md` | Human-readable Wisp design brief with skill stack, workflow, critique rubric, and completion gates. |
| `design-analysis.json` | Machine-readable before/after target analysis: structure, density, assets, computed visual styles, signals, and risks. |
| `design-analysis.md` | Human-readable target context so agents can avoid generic design decisions before editing source code. |
| `design-directions.json` | Machine-readable direction map with target-aware implementation routes. |
| `design-directions.md` | Human-readable variants inspired by the Wisp design loop: choose a route, justify it, then implement. |
| `design-critique.json` | Machine-readable automatic preflight critique with scores, hard fails, and quick wins. |
| `design-critique.md` | Human-readable critique report so weak design output is caught before implementation handoff. |
| `design-gate.json` | Machine-readable pass/fail gate for design implementation proof. |
| `design-gate.md` | Agent scorecard for context inventory, asset usage, variation decision, anti-slop scan, responsive proof, and rubric scoring. |
| `implement.md` | Agent handoff prompt for implementing the approved target in source code. |
| `review.html` | Local review page for comparing the exported proof. |

Send `implement.md` plus the screenshots to Codex, Claude Code, Cursor, or another coding agent when you want the approved visual direction implemented in the actual project.

## Built-In Design Loop

WispPatch does more than export a CSS diff. The generated implementation prompt includes a Wisp Design Contract so the next coding agent has a stronger quality bar:

- read `.wisppatch/latest/design-brief.md` before editing
- use `.wisppatch/latest/design-analysis.md` to understand the selected target's structure, assets, controls, typography, and risks
- choose or justify a route from `.wisppatch/latest/design-directions.md` before source edits
- address `.wisppatch/latest/design-critique.md` hard fails and quick wins before handoff
- complete `.wisppatch/latest/design-gate.md` before claiming implementation
- study `before.png`, `after.png`, and the selected target bounds
- look for `DESIGN.md`, brand docs, style guides, tokens, and component docs
- use the local Wisp asset sheets as visual references when relevant
- combine Open Design's file-contract workflow with `design-taste-frontend` and Huashu-style critique
- avoid generic AI UI patterns such as card spam, purple-blue gradients, fake metrics, and vague marketing copy
- preserve app behavior, routes, auth, billing, provider setup, and data fetching
- implement only the code needed to match the approved target
- score the result against a 5-part critique rubric before handoff
- fail the handoff if the scorecard exposes fake content, weak hierarchy, generic visuals, missing responsive proof, or scope creep
- run the app and compare the implemented result against `after.png`

See [docs/design-workflow.md](docs/design-workflow.md) for the full workflow.

## Wisp Learning Rules

WispPatch treats design feedback as product rules. The runtime and exported briefs should preserve lessons from real correction loops:

- If a user asks for a text change, change text only. Do not apply a visual recipe unless the request is clearly about visual design.
- After Wisp presents a patch, the user can keep chatting. Approval is not a dead end.
- Wisp is a character, not a cursor sticker. It flies to the target, inspects it, then faces the user while waiting.
- Chat bubbles belong above/right of Wisp like a comic thought bubble and must not be covered by the mascot.
- The prompt, chips, and approval buttons should stay close to the supplied manga UI sheets: hard ink borders, angular strip controls, gold accents, and halftone texture.
- Wisp face details must stay aligned and readable over transparent yellow assets.
- Every visual correction should be verified with screenshots or browser geometry, then folded back into docs or runtime constraints.

## Safety Model

WispPatch v0.1.0 is intentionally narrow:

- no login
- no cloud upload
- no database
- no hosted AI provider
- no automatic source edits
- no MCP server yet
- no browser extension packaging yet

The browser patch disappears on refresh unless WispPatch reapplies it. Screenshots stay on your machine unless you choose to share them.

## Project Layout

```text
src/cli          CLI, browser launch, local bridge, output paths
src/injected     Wisp overlay, target picker, reversible visual recipes
src/export       VisualPatch JSON, implementation prompt, review HTML
assets           Wisp mascot and UI direction sheets
demo             Static demo target for local verification
docs             Product and implementation notes
DESIGN.md        WispPatch product design contract
```

## Commands

| Command | Description |
| --- | --- |
| `npm run check` | Type-check the project. |
| `npm run build` | Build the CLI and injected overlay into `dist`. |
| `npm run demo` | Serve the local demo page at `http://127.0.0.1:4177`. |
| `node dist/cli/index.js <url>` | Launch WispPatch against a target page. |

## Roadmap

- higher-fidelity Wisp motion and sprite polish
- richer visual recipes and target-aware layout fixes
- side-by-side diff review
- stronger implementation-agent adapters
- optional MCP workflow
- optional browser extension
- optional hosted/shareable review links

## Contributing

Keep v0.1.0 local-first and source-safe. Runtime patches should be reversible, exported prompts should stay scoped to the approved visual target, and any future provider integration must have explicit user consent and clear secret handling.

Before sending a change:

```powershell
npm run check
npm run build
```

## License

No license has been declared yet. Add a license before publishing this repository as reusable open source.
