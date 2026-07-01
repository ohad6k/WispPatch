# WispPatch MVP Design

## Product
WispPatch is a local-first visual approval layer for AI-assisted UI changes. The user runs a command against a local website, Wisp appears in the browser, the user clicks a section, asks for a change, sees a temporary visual patch, and exports an approved visual target before any source code changes.

## Naming
- Public product: WispPatch
- Mascot: Wisp
- CLI command: `wisppatch`
- Export folder: `.wisppatch/latest`

## Core Loop
1. User runs `wisppatch http://localhost:3000`.
2. Browser opens with the target page.
3. Wisp floats in the bottom-right corner with an input bubble.
4. User hovers sections and sees a yellow selection outline.
5. User clicks a target section.
6. Wisp asks what to patch.
7. User types a request or clicks a quick action chip.
8. Wisp flies to the target, scans, and applies a temporary visual recipe.
9. Manga approval controls appear: Lock It In, Try Again, Push Further, Undo, Export.
10. Export writes before/after screenshots, `visualpatch.json`, `implement.md`, and `review.html`.

## MVP Scope
The MVP proves the viral local loop. It does not include cloud sharing, login, MCP, automatic code edits, hosted AI, billing, teams, or browser extension packaging.

## Visual Direction
The supplied assets in `D:\GhostPatch\assets` define the style:
- luminous yellow Wisp mascot
- clean light UI surfaces
- manga-style approval buttons
- soft scan rings and glow trails
- crisp icon buttons and quick action chips
- short, confident product copy

The implementation should recreate this direction using inline SVG, CSS, and isolated overlay markup. The PNG sheets are references, not production UI sprites for v1.

## Interaction States
- Idle: Wisp gently floats in the corner.
- Targeting: hover outlines candidate sections.
- Listening: Wisp focuses on the selected target and input.
- Flying: Wisp moves toward the selected element with a glow trail.
- Scanning: rings pulse around the target.
- Patching: temporary recipe styles are injected.
- Presenting: Wisp returns to the user and shows approval actions.
- Undo: all WispPatch-injected styles are removed.
- Export: local proof artifacts are written.

## Technical Design
The CLI launches Chromium through Playwright, navigates to the target URL, injects a bundled overlay script and stylesheet, and starts a local bridge server for export actions. The overlay mounts into a Shadow DOM root so host page styles do not leak into WispPatch and WispPatch styles do not affect the app.

The patch engine starts with handcrafted recipes:
- Make premium
- Fix spacing
- Dark mode
- Stronger CTA
- Cleaner cards

Recipes create reversible operations. V1 prioritizes CSS rule injection for visual requests and targeted text replacement for explicit copy requests. DOM restructuring remains deferred unless needed.

## VisualPatch Export
Approved exports contain:
- `before.png`
- `after.png`
- `visualpatch.json`
- `implement.md`
- `review.html`

The JSON stores the URL, viewport, goal, selected target selector, bounds, recipe, operations, screenshots, and acceptance criteria. `implement.md` instructs a coding agent to match the approved visual target without rewriting unrelated app logic.

## Safety Rules
- No source files are edited by WispPatch v1.
- No screenshots are uploaded.
- No login is required.
- Undo must remove injected styles.
- Export is explicit.
- The README must make local-only behavior clear.

## Acceptance Criteria
- A user can run WispPatch against the demo page.
- Wisp appears and remains visually isolated.
- Hover/click target selection works.
- A selected section can be temporarily patched.
- Undo removes the patch.
- Export writes the complete proof package.
- Build and demo commands are documented.
