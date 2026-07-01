import type { DesignIteration, VisualPatchDocument } from "./visualPatch.js";

export type WispDesignIterations = {
  version: "wisp-design-iterations.v1";
  mode: "design-loop-history";
  goal: string;
  target: VisualPatchDocument["target"];
  acceptedIterationId?: number;
  iterations: DesignIteration[];
  agentUse: string[];
};

export function createWispDesignIterations(patch: VisualPatchDocument): WispDesignIterations {
  return {
    version: "wisp-design-iterations.v1",
    mode: "design-loop-history",
    goal: patch.goal,
    target: patch.target,
    acceptedIterationId: patch.acceptedIterationId,
    iterations: patch.iterations || [],
    agentUse: [
      "Use this file to understand the user's Wisp exploration loop before implementing source code.",
      "The selected iteration is the approved direction; previous iterations show alternatives that were tried, pushed, refined, or undone.",
      "If an earlier iteration has useful traits, only carry them forward when they do not contradict after.png or design-gate.md.",
      "If there is only one iteration, treat design-directions.md as the required variation map before source edits.",
      "Do not implement undone iterations unless the user explicitly asks for them."
    ]
  };
}

function bullet(items: string[], fallback = "None recorded."): string {
  if (items.length === 0) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join("\n");
}

function renderIteration(iteration: DesignIteration, acceptedIterationId: number | undefined): string {
  const accepted = iteration.id === acceptedIterationId || iteration.selected;
  return `### Iteration ${iteration.id}${accepted ? " - Accepted" : ""}

| Field | Value |
| --- | --- |
| Action | ${iteration.action} |
| Recipe | ${iteration.recipe} |
| Intensity | ${iteration.intensity} |
| Requested goal | ${iteration.goal || "Not recorded"} |
| Effective goal | ${iteration.effectiveGoal || "Not recorded"} |
| Operation count | ${iteration.operationCount} |

Summary: ${iteration.summary}

Operation types:

${bullet(iteration.operationTypes)}

Changed selectors:

${bullet(iteration.changedSelectors)}
`;
}

export function createWispDesignIterationsMarkdown(patch: VisualPatchDocument): string {
  const history = createWispDesignIterations(patch);
  const accepted = history.iterations.find(
    (iteration) => iteration.id === history.acceptedIterationId || iteration.selected
  );
  return `# Wisp Design Iterations

Mode: design-loop-history

## Goal

${history.goal}

## Target

- Label: ${history.target.label}
- Selector: \`${history.target.selector}\`
- Bounds: x=${Math.round(history.target.bounds.x)}, y=${Math.round(
    history.target.bounds.y
  )}, width=${Math.round(history.target.bounds.width)}, height=${Math.round(
    history.target.bounds.height
  )}

## How Agents Should Use This

${bullet(history.agentUse)}

## Accepted Direction

${
  accepted
    ? `Iteration ${accepted.id}: ${accepted.summary}`
    : "No accepted iteration was recorded. Use after.png as the source of truth and document the missing history in design-gate.md."
}

## Iteration History

${history.iterations.length ? history.iterations.map((iteration) => renderIteration(iteration, history.acceptedIterationId)).join("\n") : "No iterations were recorded."}
`;
}
