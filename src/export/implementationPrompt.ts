import type { VisualPatchDocument } from "./visualPatch.js";

export function createImplementationPrompt(patch: VisualPatchDocument): string {
  const operations = patch.operations
    .map((operation, index) => {
      if (operation.type === "text_replace") {
        return `${index + 1}. ${operation.type} on \`${operation.selector}\`\n  - text: ${operation.text}`;
      }

      const css = Object.entries(operation.css)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join("\n");
      return `${index + 1}. ${operation.type} on \`${operation.selector}\`\n${css}`;
    })
    .join("\n\n");

  return `# WispPatch Implementation Prompt

You are implementing an approved WispPatch visual change.

## Goal
${patch.goal}

## Approved Visual Target
- Before screenshot: .wisppatch/latest/before.png
- After screenshot: .wisppatch/latest/after.png
- Review page: .wisppatch/latest/review.html
- Wisp design brief: .wisppatch/latest/design-brief.md
- Wisp design brief JSON: .wisppatch/latest/design-brief.json
- Wisp target analysis: .wisppatch/latest/design-analysis.md
- Wisp target analysis JSON: .wisppatch/latest/design-analysis.json
- Wisp page design DNA: .wisppatch/latest/design-dna.md
- Wisp page design DNA JSON: .wisppatch/latest/design-dna.json
- Wisp asset registry: .wisppatch/latest/design-assets.md
- Wisp asset registry JSON: .wisppatch/latest/design-assets.json
- Wisp reusable design system: .wisppatch/latest/design-system.md
- Wisp reusable design system JSON: .wisppatch/latest/design-system.json
- Wisp design iterations: .wisppatch/latest/design-iterations.md
- Wisp design iterations JSON: .wisppatch/latest/design-iterations.json
- Wisp design directions: .wisppatch/latest/design-directions.md
- Wisp design directions JSON: .wisppatch/latest/design-directions.json
- Wisp automatic critique: .wisppatch/latest/design-critique.md
- Wisp automatic critique JSON: .wisppatch/latest/design-critique.json
- Wisp browser verification: .wisppatch/latest/design-verification.md
- Wisp browser verification JSON: .wisppatch/latest/design-verification.json
- Wisp design gate: .wisppatch/latest/design-gate.md
- Wisp design gate JSON: .wisppatch/latest/design-gate.json
- Design workflow: docs/design-workflow.md
- Wisp visual references: assets/
- App design contract: DESIGN.md, brand docs, style guide, or component docs if present

## Target
- Label: ${patch.target.label}
- Selector: \`${patch.target.selector}\`
- Bounds: x=${Math.round(patch.target.bounds.x)}, y=${Math.round(
    patch.target.bounds.y
  )}, width=${Math.round(patch.target.bounds.width)}, height=${Math.round(
    patch.target.bounds.height
  )}

## Temporary Visual Operations
${operations}

## Built-In Design Skill Contract
Treat the approved screenshots as the source of truth. The operations above are a visual hint from WispPatch, not a command to copy injected CSS blindly.

Before editing, read \`.wisppatch/latest/design-brief.md\`, \`.wisppatch/latest/design-analysis.md\`, \`.wisppatch/latest/design-dna.md\`, \`.wisppatch/latest/design-assets.md\`, \`.wisppatch/latest/design-system.md\`, \`.wisppatch/latest/design-iterations.md\`, \`.wisppatch/latest/design-directions.md\`, \`.wisppatch/latest/design-critique.md\`, \`.wisppatch/latest/design-verification.md\`, and \`.wisppatch/latest/design-gate.md\` if present. Then load any relevant local design guidance or frontend taste skill available in your agent environment. If this repo contains \`docs/design-workflow.md\`, read it before changing UI code.

Use an Open Design-style contract loop when the target app supports it: find the brand/design contract first, apply the relevant design skill, implement in real components, preview the artifact, critique it against the approved screenshot, then hand off only after verification.

Design quality requirements:
- Make the implementation feel deliberate and product-specific, not like generic AI output.
- Preserve the target app's existing design system, component APIs, routing, state, and data behavior.
- Respect \`DESIGN.md\`, brand docs, style guides, design tokens, or component-library conventions when they exist.
- Use \`design-dna.md\` to preserve or intentionally supersede the surrounding page's color, type, spacing, asset, and component signals.
- Use \`design-assets.md\` to decide which real assets can be reused, which asset needs are missing, and where honest placeholders are required.
- Use \`design-system.md\` as the reusable DESIGN.md-style contract distilled from the Wisp capture.
- Use \`design-iterations.md\` to understand the user's actual exploration loop and accepted pass.
- Use \`design-verification.md\` to confirm the exported browser artifact has valid screenshots, a visible target, no desktop/mobile horizontal overflow, and a passing critique.
- Use the local Wisp or brand assets only when they genuinely support the approved visual direction.
- Avoid generic three-card feature rows, decorative blobs, purple-blue AI gradients, fake metrics, fake names, vague startup copy, and unrelated page rewrites.
- Keep typography, spacing, color, and responsive behavior coherent across the surrounding page.
- Implement real interaction states when the changed UI exposes controls: hover, active, disabled, loading, empty, and error where applicable.

## Implementation Loop
1. Read \`.wisppatch/latest/design-brief.md\` and \`.wisppatch/latest/design-gate.md\`; list the completion gates that apply.
2. Read \`.wisppatch/latest/design-analysis.md\`; note the target structure, density, assets, typography, controls, and risks.
3. Read \`.wisppatch/latest/design-dna.md\`; note page-level colors, typography, assets, component signals, and risks.
4. Read \`.wisppatch/latest/design-assets.md\`; note captured real assets, missing logo/product/UI needs, and placeholder requirements.
5. Read \`.wisppatch/latest/design-system.md\`; note reusable token, asset, component, and anti-slop rules.
6. Read \`.wisppatch/latest/design-iterations.md\`; identify the accepted pass and any undone routes to avoid.
7. Read \`.wisppatch/latest/design-directions.md\`; choose one route or write the evidence that supersedes it.
8. Read \`.wisppatch/latest/design-critique.md\`; list hard fails and quick wins that apply.
9. Read \`.wisppatch/latest/design-verification.md\`; resolve or document any failed exported-artifact checks before source implementation.
10. Inspect the app structure and find the real source files for the selected target.
11. Look for \`DESIGN.md\`, brand docs, style guides, design tokens, and component-library docs.
12. Compare \`before.png\` and \`after.png\`; write down the concrete visual deltas before editing.
13. Implement the smallest source-code change that recreates the approved target.
14. Run the app and compare the result against \`after.png\`.
15. Score the result against the design brief critique rubric. Iterate once if any dimension is below 8/10.
16. Complete the required checks in \`.wisppatch/latest/design-gate.md\`.
17. Check one desktop viewport and one mobile viewport.
18. Run the project's normal verification command.

## Rules
- Do not rewrite the app.
- Do not change backend logic, auth, billing, data fetching, routes, or provider configuration.
- Implement only the visual changes needed to match after.png.
- Preserve responsive behavior.
- After implementation, run the app and compare it against after.png before claiming completion.

## Completion Proof
Your final response must include:
- changed files
- verification commands and results
- desktop and mobile visual check evidence
- target-analysis findings used
- design-dna findings used or superseded
- design-assets findings used, missing asset needs, and placeholder decisions
- design-system rules used or superseded
- design-iterations accepted pass and avoided routes
- chosen design-directions route or superseding evidence
- design-critique hard fails and quick wins addressed
- design-verification result and any failed checks addressed
- critique rubric scores from \`.wisppatch/latest/design-brief.md\`
- completed checks from \`.wisppatch/latest/design-gate.md\`
- any dimension below 8/10 and the specific blocker or follow-up
`;
}
