/**
 * WorkedExample component. `chunk.workedExample` is authored as
 * subgoal-labelled `phases` (Catrambone) with a one-line `problem`, an
 * optional `figure`, and a `keyMove` self-explanation answer; the
 * reveal-by-phase behaviour lives in js/lesson-slides.js. A legacy flat
 * `steps: [...]` array still renders (as one unlabelled phase).
 * See master-project-prompt.md §10.
 */
import { mdInline } from "../../js/markdown.js";
import { esc, renderFigure } from "./primitives.js";

export function renderWorkedExample(we) {
  if (!we) return "";
  const phases =
    Array.isArray(we.phases) && we.phases.length
      ? we.phases
      : [{ label: "", steps: we.steps || [] }];

  const phaseList = phases
    .map((p, i) => {
      const steps = (p.steps || []).map((s) => `<li>${mdInline(s)}</li>`).join("\n");
      return `
    <li class="we-phase" data-phase="${i}"${i === 0 ? "" : " hidden"}>
      ${p.label ? `<p class="we-phase__label">${esc(p.label)}</p>` : ""}
      <ol class="we-phase__steps">
        ${steps}
      </ol>
    </li>`;
    })
    .join("\n");

  const keyMove = we.keyMove
    ? `
  <div class="worked-example__keymove" hidden>
    <button type="button" class="worked-example__keymove-toggle">Before you check: what was the one move that mattered here?</button>
    <p class="worked-example__keymove-text" hidden>${mdInline(we.keyMove)}</p>
  </div>`
    : "";

  return `
  <div class="worked-example" data-scaffold="${esc(we.scaffold || "full")}" data-phases="${phases.length}">
    <div class="worked-example__head">
      <span class="worked-example__badge">Worked Example</span>
      <button type="button" class="worked-example__showall">Show all steps</button>
    </div>
    ${we.problem ? `<p class="worked-example__problem">${mdInline(we.problem)}</p>` : ""}
    ${renderFigure(we.figure)}
    <ol class="we-phases">
      ${phaseList}
    </ol>
    <button type="button" class="worked-example__next">Reveal next part ▸</button>
    ${keyMove}
  </div>`;
}
