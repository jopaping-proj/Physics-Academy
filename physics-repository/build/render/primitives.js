/**
 * Render primitives shared by every slide component: HTML escaping, the
 * <section class="slide"> shell, inlined SVG figures, and the quiz mount.
 * Kept tiny and dependency-light so components can compose them freely.
 */
import fs from "node:fs";
import path from "node:path";
import { mdInline } from "../../js/markdown.js";
import { DIAGRAMS_DIR } from "./paths.js";

export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function attr(str) {
  return esc(str).replace(/"/g, "&quot;");
}

/**
 * Wrap one slide descriptor in its <section> shell. One heading per
 * card (signaling principle): the group label is the <h2>, the optional
 * subtitle names this card's role within a multi-card group, and bodies
 * never repeat either.
 * @param {{id,group,groupLabel,subtitle?,title?,cls?,componentKey?,body}} s
 */
export function wrapSlide(s, indexInGroup, groupSize) {
  const stepHint =
    groupSize > 1 ? `<span class="slide__step">${indexInGroup + 1} / ${groupSize}</span>` : "";
  const ck = s.componentKey ? ` data-component-key="${attr(s.componentKey)}"` : "";
  return `
<section class="slide ${s.cls || ""}" id="${attr(s.id)}"${ck} tabindex="-1"
         data-group="${attr(s.group)}" data-group-label="${attr(s.groupLabel)}"
         data-slide-title="${attr(s.title || s.subtitle || s.groupLabel)}">
  <div class="slide__inner">
    <header class="slide__head">
      <h2 class="slide__title">${esc(s.groupLabel)}</h2>
      ${s.subtitle ? `<p class="slide__subtitle">${esc(s.subtitle)}</p>` : ""}
      ${stepHint}
    </header>
    <div class="slide__body">
      ${s.body}
    </div>
  </div>
</section>`;
}

/**
 * Inlines one authored SVG (path relative to assets/diagrams/) as a
 * <figure>. Inlining keeps it themeable and saves a request; the SVG
 * carries its own role="img" + aria-label.
 * @param {{svg:string, caption?:string}} fig
 */
export function renderFigure(fig) {
  if (!fig || !fig.svg) return "";
  const p = path.join(DIAGRAMS_DIR, fig.svg);
  let svg;
  try {
    svg = fs.readFileSync(p, "utf8");
  } catch {
    console.warn(`[build] WARNING: figure not found: assets/diagrams/${fig.svg}`);
    return "";
  }
  svg = svg.replace(/<\?xml[^>]*\?>\s*/i, "").trim();
  const caption = fig.caption ? `<figcaption>${mdInline(fig.caption)}</figcaption>` : "";
  return `<figure class="figure">${svg}${caption}</figure>`;
}

export function renderFigures(figures) {
  if (!Array.isArray(figures) || !figures.length) return "";
  return `<div class="figure-row">${figures.map(renderFigure).join("\n")}</div>`;
}

/** Emits an empty mount + embedded question JSON. js/assessment.js renders it.
 * A free-response part may carry `figure` / `figures` (same shape as a
 * chunk figure) — the correct diagram for that part. assessment.js can't
 * read the filesystem, so we inline those SVGs here into `modelFigureHtml`
 * and drop the raw paths. */
export function renderFormativeCheck(check, idSuffix) {
  if (!check) return "";
  let prepared = check;
  if (Array.isArray(check.parts) && check.parts.some((p) => p && (p.figure || p.figures))) {
    prepared = {
      ...check,
      parts: check.parts.map((p) => {
        const figs = p && (p.figures || (p.figure ? [p.figure] : null));
        if (!figs) return p;
        const { figure, figures, ...rest } = p;
        return { ...rest, modelFigureHtml: renderFigures(figs) };
      }),
    };
  }
  return `
  <div class="quiz-mount" id="formative-check-${esc(idSuffix)}">
    <script type="application/json" class="quiz-question-data">${JSON.stringify(prepared)}</script>
  </div>`;
}
