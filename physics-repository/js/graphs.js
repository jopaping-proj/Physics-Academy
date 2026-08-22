/**
 * Thin wrapper around Plotly.js for parameterized Graph Explorer panels
 * (master-project-prompt.md §13). Lazy-loaded only on lessons that use
 * a graph, per §29 — never imported from a page-global bundle.
 *
 * This is a Phase 1 skeleton: it establishes the shared API
 * (renderParameterizedGraph) that Phase 2's Newton's Second Law lesson
 * will call with real F-vs-a / F-vs-m data. Plotly itself is not
 * bundled yet — load it from a pinned CDN URL only on pages that need
 * it, e.g.:
 *   <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" defer></script>
 */

/**
 * @param {HTMLElement} container - target .interactive-panel__canvas-wrap element
 * @param {{x: number[], y: number[], xLabel: string, yLabel: string, title?: string}} spec
 */
export function renderParameterizedGraph(container, spec) {
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
export function updateGraphData(container, data) {
  if (typeof window.Plotly === "undefined") return;
  window.Plotly.update(container, { x: [data.x], y: [data.y] });
}
