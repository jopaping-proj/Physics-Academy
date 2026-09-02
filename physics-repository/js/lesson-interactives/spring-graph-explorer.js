/**
 * Spring force–extension graph explorer for the "Gravitation, Springs,
 * and Apparent Weight" lesson (C2.10 / CED topic 2.8). Registered
 * through window.PA.panel.
 *
 * A force–extension graph: the magnitude of the spring force against
 * the stretch from natural length. The line F = k x runs through the
 * origin, and its SLOPE is the spring constant k. Move the "test
 * extension" and read the predicted force straight off the line —
 * no formula needed once you can read the graph.
 *
 * Plain <script>, not an ES module (see js/content-loader.js).
 */
(function () {
  const { cssVar, register } = window.PA.panel;

  function slider(controls, { label, min, max, step, value, unit, fmt }) {
    const wrap = document.createElement("label");
    wrap.className = "fx2__row";
    const name = document.createElement("span");
    name.className = "fx2__name";
    name.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min); input.max = String(max); input.step = String(step);
    input.value = String(value);
    input.setAttribute("aria-label", label);
    const out = document.createElement("span");
    out.className = "fx2__val";
    const show = () => (out.textContent = (fmt ? fmt(+input.value) : input.value) + (unit ? " " + unit : ""));
    show();
    wrap.append(name, input, out);
    controls.appendChild(wrap);
    return { input, show };
  }

  function mount({ controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;
    const state = { k: 60, x: 0.2 };
    const X_MAX = 0.5;   // m
    const F_MAX = 100;   // N (y-axis top)

    const stage = document.createElement("div");
    stage.className = "fx2__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 300;
    canvas.setAttribute("role", "img");
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    const sK = slider(controls, { label: "Spring constant k", min: 20, max: 200, step: 10, value: state.k, unit: "N/m" });
    const sX = slider(controls, { label: "Test extension x", min: 0, max: 0.4, step: 0.02, value: state.x, unit: "m", fmt: (v) => v.toFixed(2) });
    sK.input.addEventListener("input", () => { state.k = +sK.input.value; sK.show(); draw(); });
    sX.input.addEventListener("input", () => { state.x = +sX.input.value; sX.show(); draw(); });

    const readout = document.createElement("div");
    readout.className = "ipe__readout";
    (promptEl || controls).appendChild(readout);

    const PAD_L = 52, PAD_B = 40, PAD_T = 16, PAD_R = 16;
    const plotW = () => canvas.width - PAD_L - PAD_R;
    const plotH = () => canvas.height - PAD_T - PAD_B;
    const sx = (x) => PAD_L + (x / X_MAX) * plotW();
    const sy = (f) => canvas.height - PAD_B - (f / F_MAX) * plotH();

    function draw() {
      const grid = cssVar("--sim-graph-grid", "#2a3a5c");
      const ink = cssVar("--sim-text", "#e0e0e0");
      const line = cssVar("--sim-green", "#51cf66");
      const pt = cssVar("--sim-amber", "#f0c27a");
      ctx.fillStyle = cssVar("--sim-graph-bg", "#16213e");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // gridlines
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.fillStyle = cssVar("--sim-graph-grid", "#8b96a5");
      ctx.font = "11px system-ui, sans-serif";
      for (let x = 0; x <= X_MAX + 1e-9; x += 0.1) {
        ctx.beginPath(); ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(F_MAX)); ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(x.toFixed(1), sx(x), canvas.height - PAD_B + 16);
      }
      for (let f = 0; f <= F_MAX + 1e-9; f += 25) {
        ctx.beginPath(); ctx.moveTo(sx(0), sy(f)); ctx.lineTo(sx(X_MAX), sy(f)); ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(String(f), PAD_L - 8, sy(f) + 4);
      }

      // axes
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(X_MAX), sy(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(0), sy(F_MAX)); ctx.stroke();
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.fillText("extension  x  (m)", sx(X_MAX / 2), canvas.height - 6);
      ctx.save();
      ctx.translate(14, sy(F_MAX / 2));
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("spring force  F  (N)", 0, 0);
      ctx.restore();

      // the line F = k x, clipped to the plot box
      const xEndByF = F_MAX / state.k;
      const xEnd = Math.min(X_MAX, xEndByF);
      ctx.strokeStyle = line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0));
      ctx.lineTo(sx(xEnd), sy(state.k * xEnd));
      ctx.stroke();

      // test point + guide lines
      const F = state.k * state.x;
      if (state.x > 0) {
        ctx.strokeStyle = pt;
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sx(state.x), sy(0)); ctx.lineTo(sx(state.x), sy(Math.min(F, F_MAX))); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx(0), sy(Math.min(F, F_MAX))); ctx.lineTo(sx(state.x), sy(Math.min(F, F_MAX))); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = pt;
        ctx.beginPath(); ctx.arc(sx(state.x), sy(Math.min(F, F_MAX)), 4.5, 0, Math.PI * 2); ctx.fill();
      }

      // slope callout, parked in clear space above the line near its right end
      const mx = xEnd * 0.62;
      ctx.fillStyle = line;
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "left";
      const labelY = Math.min(sy(state.k * mx) - 20, sy(F_MAX) + 16);
      ctx.fillText("slope = k = " + state.k + " N/m", sx(mx) + 6, labelY);

      readout.innerHTML =
        `<p class="ipe__pair"><span class="ipe__k">Read the slope</span> the line rises ${state.k} N for every 1 m of extension &mdash; so <b>k = ${state.k} N/m</b>.</p>` +
        `<p class="ipe__rule"><span class="ipe__k">Predict</span> at x = <b>${state.x.toFixed(2)} m</b>, follow the line up: F = k x = ${state.k} × ${state.x.toFixed(2)} = <b>${F.toFixed(1)} N</b>. The spring pulls back toward its natural length with this force.</p>`;
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p>The force–extension graph is a straight line through the origin, and its <strong>slope is the spring constant k</strong>. A stiffer spring gives a steeper line.</p><p>Once you can read k off the slope, you can predict the force at <em>any</em> extension without the formula — just follow the line. And going the other way: a measured force tells you the extension.</p>";
    }

    return draw;
  }

  register("spring-graph-explorer", mount);
})();
