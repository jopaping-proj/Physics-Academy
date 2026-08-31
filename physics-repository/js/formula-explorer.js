/**
 * Slider-driven formula manipulative (master-project-prompt.md §12):
 * wires up slider → live value/equation updates and emits a change
 * event other scripts can listen for. Used by both the Newton's
 * Second Law Formula Explorer and the Cart on a Track simulation's
 * mass/force sliders.
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * Wrapped in an IIFE so its internals don't leak into the shared
 * top-level scope every plain <script> on the page shares.
 */
window.PA = window.PA || {};

(function () {
/**
 * @param {HTMLElement} container - the .interactive-panel element
 * @param {{
 *   variables: Array<{ key: string, label: string, min: number, max: number, step: number, initial: number, unit: string }>,
 *   compute: (values: Record<string, number>) => Record<string, number>,
 *   render: (results: Record<string, number>, values: Record<string, number>) => void
 * }} config
 */
function initFormulaExplorer(container, config) {
  const values = {};
  config.variables.forEach((v) => (values[v.key] = v.initial));

  const controls = container.querySelector(".interactive-panel__controls");

  config.variables.forEach((v) => {
    const group = document.createElement("div");
    group.className = "interactive-panel__slider-group";

    const label = document.createElement("label");
    label.setAttribute("for", `fe-${v.key}`);
    group.appendChild(label);

    const input = document.createElement("input");
    input.type = "range";
    input.id = `fe-${v.key}`;
    input.min = String(v.min);
    input.max = String(v.max);
    input.step = String(v.step);
    input.value = String(v.initial);

    const updateLabel = () => {
      label.textContent = `${v.label}: ${input.value} ${v.unit}`;
    };
    updateLabel();

    input.addEventListener("input", () => {
      values[v.key] = Number(input.value);
      updateLabel();
      const results = config.compute(values);
      config.render(results, values);
      container.dispatchEvent(
        new CustomEvent("formula-explorer:change", { bubbles: true, detail: { values, results } })
      );
    });

    group.appendChild(input);
    controls.appendChild(group);
  });

  // Initial render.
  const results = config.compute(values);
  config.render(results, values);
}

window.PA.formulaExplorer = { initFormulaExplorer };
})();
