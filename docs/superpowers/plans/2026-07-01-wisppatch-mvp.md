# WispPatch MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first WispPatch MVP where a CLI opens a browser, injects Wisp into a running page, lets the user select a section, applies a temporary visual patch, and exports VisualPatch proof artifacts.

**Architecture:** A TypeScript CLI uses Playwright to launch Chromium and inject a bundled Shadow DOM overlay into the target page. The overlay handles Wisp UI, target picking, recipe application, approval actions, undo, and bridge calls; the CLI-side bridge writes screenshots and export files.

**Tech Stack:** Node.js, TypeScript, Playwright, esbuild, plain DOM/CSS overlay, static HTML demo.

---

## File Structure
- `package.json`: package metadata, scripts, CLI binary, dependencies.
- `tsconfig.json`: TypeScript settings.
- `src/cli/index.ts`: CLI entrypoint, URL parsing, browser launch.
- `src/cli/bridge.ts`: local HTTP bridge for overlay export requests.
- `src/cli/paths.ts`: output path helpers.
- `src/injected/overlay.ts`: injected overlay app bootstrap.
- `src/injected/styles.css`: isolated WispPatch overlay styles.
- `src/injected/wispSvg.ts`: inline Wisp mascot SVG.
- `src/injected/targetPicker.ts`: hover/click target selection.
- `src/injected/selectors.ts`: stable selector generation.
- `src/injected/mutations.ts`: visual operations, recipe application, undo.
- `src/injected/types.ts`: shared injected runtime types.
- `src/export/visualPatch.ts`: VisualPatch schema/export helper.
- `src/export/implementationPrompt.ts`: generated implementation prompt.
- `src/export/reviewHtml.ts`: local review page.
- `demo/index.html`: demo landing page.
- `demo/styles.css`: intentionally plain demo styling.
- `README.md`: commands, scope, safety, and MVP usage.

## Task 1: Scaffold Project

**Files:**
- Create: `D:\GhostPatch\package.json`
- Create: `D:\GhostPatch\tsconfig.json`
- Create: `D:\GhostPatch\src\cli\index.ts`
- Create: `D:\GhostPatch\src\injected\overlay.ts`

- [ ] **Step 1: Add package metadata and scripts**

Create `package.json` with:

```json
{
  "name": "wisppatch",
  "version": "0.1.0",
  "private": true,
  "description": "Local visual UI patching with Wisp before code changes.",
  "type": "module",
  "bin": {
    "wisppatch": "dist/cli/index.js"
  },
  "scripts": {
    "build": "node scripts/build.mjs",
    "demo": "node scripts/serve-demo.mjs",
    "start": "node dist/cli/index.js",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "playwright": "^1.45.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "esbuild": "^0.23.0",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: Add TypeScript config**

Create `tsconfig.json` with strict Node-oriented settings.

- [ ] **Step 3: Add placeholder CLI and overlay entry files**

Add minimal exports so the first build can run before behavior exists.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `node_modules` and `package-lock.json` are created.

## Task 2: Build Pipeline

**Files:**
- Create: `D:\GhostPatch\scripts\build.mjs`
- Modify: `D:\GhostPatch\src\cli\index.ts`
- Modify: `D:\GhostPatch\src\injected\overlay.ts`

- [ ] **Step 1: Add esbuild script**

Bundle `src/cli/index.ts` to `dist/cli/index.js` for Node and `src/injected/overlay.ts` to `dist/injected/overlay.js` for the browser. Copy `src/injected/styles.css` to `dist/injected/styles.css`.

- [ ] **Step 2: Run typecheck**

Run: `npm run check`

Expected: no TypeScript errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: `dist/cli/index.js` and `dist/injected/overlay.js` exist.

## Task 3: Static Demo Page

**Files:**
- Create: `D:\GhostPatch\demo\index.html`
- Create: `D:\GhostPatch\demo\styles.css`
- Create: `D:\GhostPatch\scripts\serve-demo.mjs`

- [ ] **Step 1: Build a plain demo landing page**

Create a simple SaaS landing page with a hero section, CTA buttons, feature cards, and pricing area. Keep it visually plain enough that WispPatch recipes show a clear before/after.

- [ ] **Step 2: Add static server script**

Serve the `demo` folder on `http://127.0.0.1:4177`.

- [ ] **Step 3: Verify demo server**

Run: `npm run demo`

Expected: terminal prints the demo URL and serves `index.html`.

## Task 4: CLI Browser Runner And Bridge

**Files:**
- Modify: `D:\GhostPatch\src\cli\index.ts`
- Create: `D:\GhostPatch\src\cli\bridge.ts`
- Create: `D:\GhostPatch\src\cli\paths.ts`

- [ ] **Step 1: Parse URL argument**

Reject missing or invalid URL input with a clear usage message.

- [ ] **Step 2: Start bridge server**

Start a localhost HTTP server with endpoints:
- `GET /health`
- `POST /export`

- [ ] **Step 3: Launch Playwright**

Open Chromium, navigate to the supplied URL, inject built overlay JS and CSS, and pass bridge URL metadata into the page.

- [ ] **Step 4: Keep process alive**

Wait until the browser is closed, then shut down the bridge.

## Task 5: Wisp Overlay UI

**Files:**
- Modify: `D:\GhostPatch\src\injected\overlay.ts`
- Create: `D:\GhostPatch\src\injected\styles.css`
- Create: `D:\GhostPatch\src\injected\wispSvg.ts`
- Create: `D:\GhostPatch\src\injected\types.ts`

- [ ] **Step 1: Mount Shadow DOM**

Create a fixed host element and attach a Shadow DOM root.

- [ ] **Step 2: Render Wisp**

Use inline SVG and CSS classes for Wisp states.

- [ ] **Step 3: Render input bubble**

Add input, submit button, and quick action chips: Make premium, Fix spacing, Dark mode, Stronger CTA.

- [ ] **Step 4: Render approval panel**

Add Lock It In, Try Again, Push Further, Undo, and Export buttons.

- [ ] **Step 5: Verify visual isolation**

Run against the demo page and confirm host page CSS does not change overlay controls.

## Task 6: Target Picker

**Files:**
- Create: `D:\GhostPatch\src\injected\targetPicker.ts`
- Create: `D:\GhostPatch\src\injected\selectors.ts`
- Modify: `D:\GhostPatch\src\injected\overlay.ts`

- [ ] **Step 1: Identify candidate elements**

Use pointer movement to find large semantic candidates while ignoring the overlay host.

- [ ] **Step 2: Draw selection outline**

Position a fixed outline around the hovered candidate.

- [ ] **Step 3: Select on click**

Prevent normal click behavior only while picker mode is active, store selector and bounds, and update Wisp state to listening.

- [ ] **Step 4: Verify self-ignore**

Hover/click WispPatch UI and confirm it is not targetable.

## Task 7: Mutation Engine And Recipes

**Files:**
- Create: `D:\GhostPatch\src\injected\mutations.ts`
- Modify: `D:\GhostPatch\src\injected\overlay.ts`
- Modify: `D:\GhostPatch\src\injected\types.ts`

- [ ] **Step 1: Define visual operation types**

Support CSS rule operations and inline style operations.

- [ ] **Step 2: Add style injection layer**

Create a dedicated `<style>` node inside the page document for WispPatch patch rules.

- [ ] **Step 3: Implement recipes**

Map goal text and chips to `premium`, `spacing`, `dark`, `cta`, and `cards` recipes.

- [ ] **Step 4: Implement undo**

Remove injected patch style and restore tracked inline styles.

- [ ] **Step 5: Verify patch/undo**

Run on demo hero, apply premium, then undo. Expected: hero returns to original visual state.

## Task 8: Export Artifacts

**Files:**
- Create: `D:\GhostPatch\src\export\visualPatch.ts`
- Create: `D:\GhostPatch\src\export\implementationPrompt.ts`
- Create: `D:\GhostPatch\src\export\reviewHtml.ts`
- Modify: `D:\GhostPatch\src\cli\bridge.ts`
- Modify: `D:\GhostPatch\src\cli\index.ts`

- [ ] **Step 1: Capture before screenshot**

After target selection, ask the CLI bridge/browser runner to capture `before.png`.

- [ ] **Step 2: Capture after screenshot**

On export, capture `after.png` after patch application.

- [ ] **Step 3: Write VisualPatch JSON**

Write version, page URL, viewport, goal, target selector, bounds, recipe, operations, screenshots, and acceptance criteria.

- [ ] **Step 4: Write implementation prompt**

Generate a focused `implement.md` telling a coding agent to match the visual target without changing backend logic or unrelated routes.

- [ ] **Step 5: Write review HTML**

Create a local review page showing before/after image references and operation summary.

## Task 9: README And Final Verification

**Files:**
- Create: `D:\GhostPatch\README.md`

- [ ] **Step 1: Document install/build/demo commands**

Include:

```powershell
npm install
npm run build
npm run demo
node dist/cli/index.js http://127.0.0.1:4177
```

- [ ] **Step 2: Document MVP boundaries**

State that v1 is local-only, temporary, no cloud, no login, no automatic code edits.

- [ ] **Step 3: Run final commands**

Run:

```powershell
npm run check
npm run build
```

Expected: both succeed.

- [ ] **Step 4: Run manual smoke flow**

Run demo, run CLI, select hero, apply patch, undo, apply again, export. Expected: `.wisppatch/latest` contains proof artifacts.

## Self-Review
- Spec coverage: the plan covers CLI, overlay, target selection, patch recipes, approval, undo, export, demo, and docs.
- Placeholder scan: no task relies on undefined future cloud, AI, MCP, or code editing work.
- Type consistency: `VisualOperation`, target selector, bounds, recipe, and export names match the design spec.
