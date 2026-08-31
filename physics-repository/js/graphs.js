/**
 * Thin wrapper around Plotly.js for parameterized Graph Explorer panels
 * (master-project-prompt.md §13). Lazy-loaded only on lessons that set
 * `"needsPlotly": true` in their content JSON, per §29 — never
 * imported from a page-global bundle.
 *
 * Not currently used by the Newton's Second Law prototype lesson —
 * both its Formula Explorer and its Cart on a Track simulation draw
 * their own graphs directly on Canvas (see js/lesson-interactives/ and
 * simulations/), per that lesson's "no external libraries" spec. This
 * module stays available for a future lesson that genuinely wants
 * Plotly's fuller feature set (zoom, multi-trace legends, etc.); load
 * it from a pinned CDN URL only on pages that opt in, e.g.:
 *   <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" defer></script>
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * Wrapped in an IIFE so its internals don't leak into the shared
 * top-level scope every plain <script> on the page shares.
 */
window.PA = window.PA || {};

(function () {
/**
 * @param {HTMLElement} container - target .interactive-panel__canvas-wrap element
 * @param {{x: number[], y: number[], xLabel: string, yLabel: string, title?: string}} spec
 */
function renderParameterizedGraph(container, spec) {
  if (typeof window.Plotly === "undefined") {
    console.error(
      "[graphs] Plotly is not loaded on this page. Add the Plotly <script> tag before calling renderParameterizedGraph."
    );
    return;
  }

  window.Plotly.newPlot(
    container,
    [{ x: spec.x, y: spec.y, mode: "lines+markers", type: "scatter" }],
    {
      title: spec.title || "",
      xaxis: { title: spec.xLabel },
      yaxis: { title: spec.yLabel },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: getComputedStyle(document.body).getPropertyValue("--text-primary") },
      margin: { t: spec.title ? 40 : 10, r: 20, b: 40, l: 50 },
    },
    { responsive: true, displayModeBar: false }
  );
}

/**
 * Updates an existing graph in place — used when a Formula Explorer
 * slider changes and the corresponding graph needs to redraw without a
 * full re-render.
 * @param {HTMLElement} container
 * @param {{x: number[], y: number[]}} data
 */
function updateGraphData(container, data) {
  if (typeof window.Plotly === "undefined") return;
  window.Plotly.update(container, { x: [data.x], y: [data.y] });
}

/**
 * Renders a line (the underlying relationship, e.g. F = ma at a fixed
 * mass) plus a single highlighted marker for the current operating
 * point — the shape a Formula Explorer's live-updating graph needs.
 * Always calls Plotly.newPlot (a full redraw); the graphs involved are
 * small enough that this is simpler and less error-prone than tracking
 * two trace indices through incremental updates.
 * @param {HTMLElement} container
 * @param {{x: number[], y: number[], xLabel: string, yLabel: string, title?: string}} lineSpec
 * @param {{x: number, y: number}} point
 */
function renderLineWithPoint(container, lineSpec, point) {
  if (typeof window.Plotly === "undefined") {
    console.error(
      "[graphs] Plotly is not loaded on this page. Add the Plotly <script> tag before calling renderLineWithPoint."
    );
    return;
  }

  const textColor = getComputedStyle(document.body).getPropertyValue("--text-primary").trim() || "#e6edf3";
  const secondaryColor = getComputedStyle(document.body).getPropertyValue("--text-secondary").trim() || "#8b96a5";
  const accentColor = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#58a6ff";

  window.Plotly.newPlot(
    container,
    [
      {
        x: lineSpec.x,
        y: lineSpec.y,
        mode: "lines",
        type: "scatter",
        line: { color: secondaryColor },
        hoverinfo: "skip",
      },
      {
        x: [point.x],
        y: [point.y],
        mode: "markers",
        type: "scatter",
        marker: { size: 10, color: accentColor },
      },
    ],
    {
      title: lineSpec.title || "",
      xaxis: { title: lineSpec.xLabel },
      yaxis: { title: lineSpec.yLabel },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: textColor },
      margin: { t: lineSpec.title ? 40 : 10, r: 20, b: 40, l: 50 },
      showlegend: false,
    },
    { responsive: true, displayModeBar: false }
  );
}

window.PA.graphs = { renderParameterizedGraph, updateGraphData, renderLineWithPoint };
})();
