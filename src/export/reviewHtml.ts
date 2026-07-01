import type { VisualPatchDocument } from "./visualPatch.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createReviewHtml(patch: VisualPatchDocument): string {
  const operations = patch.operations
    .map((operation) => {
      const detail =
        operation.type === "text_replace"
          ? ` - <span>${escapeHtml(operation.text)}</span>`
          : "";
      return `<li><strong>${escapeHtml(operation.type)}</strong> <code>${escapeHtml(
        operation.selector
      )}</code>${detail}</li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WispPatch Review</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #17202f; background: #f6f7f9; }
      main { max-width: 1180px; margin: 0 auto; padding: 32px 18px 48px; }
      h1 { font-size: 32px; margin: 0 0 8px; }
      p { color: #5b6575; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
      .shot { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; padding: 12px; }
      img { width: 100%; border-radius: 6px; border: 1px solid #e4e7ed; display: block; }
      code { background: #eef1f5; border-radius: 4px; padding: 2px 5px; }
      section { margin-top: 26px; }
      @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <h1>WispPatch Review</h1>
      <p>${escapeHtml(patch.goal)}</p>
      <div class="grid">
        <div class="shot"><h2>Before</h2><img src="before.png" alt="Before patch" /></div>
        <div class="shot"><h2>After</h2><img src="after.png" alt="After patch" /></div>
      </div>
      <section>
        <h2>Target</h2>
        <p>${escapeHtml(patch.target.label)} - <code>${escapeHtml(
    patch.target.selector
  )}</code></p>
      </section>
      <section>
        <h2>Design Handoff</h2>
        <p><a href="design-brief.md">Read design-brief.md</a>, <a href="design-analysis.md">use design-analysis.md</a>, <a href="design-dna.md">ground decisions in design-dna.md</a>, <a href="design-assets.md">classify real assets in design-assets.md</a>, <a href="design-system.md">apply design-system.md</a>, <a href="design-iterations.md">review the Wisp iteration loop</a>, <a href="design-directions.md">choose a design direction</a>, <a href="design-critique.md">address design-critique.md</a>, <a href="design-verification.md">check design-verification.md</a>, and <a href="design-gate.md">complete design-gate.md</a> before implementing this visual target.</p>
      </section>
      <section>
        <h2>Operations</h2>
        <ul>${operations}</ul>
      </section>
    </main>
  </body>
</html>`;
}
