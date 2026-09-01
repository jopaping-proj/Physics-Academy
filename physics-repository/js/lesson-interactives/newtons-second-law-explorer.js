/**
 * Formula Explorer for Newton's second law (Phase 2 prototype lesson),
 * per master-project-prompt.md §12 and rigor-standard-addendum.md §9's
 * four-level formula-mastery progression. Self-mounts on
 * DOMContentLoaded into the
 * `[data-component-key="newtons-second-law-explorer"]` section
 * build.js emits.
 *
 * Plain script, not an ES module (see js/content-loader.js for why) —
 * wrapped in an IIFE so its internals don't collide with the other
 * plain scripts on the page.
 *
 * ONE graph only (revised 2026-08-31): net force F on the y-axis,
 * mass m on the x-axis, at the current acceleration. The line through
 * the origin is F = a·m, so its **slope is the acceleration** — the
 * single relationship this lesson wants the student to read off a
 * graph. Two sliders (mass, net force) drive a live m / F / a readout
 * and pivot the line; a big "slope = a" callout sits on the line.
 *
 * A Lock toggle freezes the graph (not the readouts) so the student
 * commits to a prediction before seeing the line move — addendum §10's
 * Predict → Commit → Observe flow.
 *
 * ---- Quick tuning guide ----
 *   MASS_RANGE / FORCE_RANGE   — slider bounds/steps
 *   AUTO_EXPLORE_PHASE_MS      — duration of each Auto-Explore sweep phase
 *   Colors come from the shared --sim-* custom properties in
 *   css/variables.css, not hard-coded here.
 */
(function () {
const MASS_RANGE = { min: 0.5, max: 10, step: 0.5, initial: 2 };
const FORCE_RANGE = { min: 1, max: 20, step: 1, initial: 10 };
const AUTO_EXPLORE_PHASE_MS = 2200;

const cssVar = window.PA.panel.cssVar;

function makeSlider({ controls, key, label, unit, range, format, onInput }) {
  const group = document.createElement("div");
  group.className = "interactive-panel__slider-group";

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", `fx-${key}`);
  group.appendChild(labelEl);

  const input = document.createElement("input");
  input.type = "range";
  input.id = `fx-${key}`;
  input.min = String(range.min);
  input.max = String(range.max);
  input.step = String(range.step);
  input.value = String(range.initial);

  const updateLabel = () => {
    labelEl.textContent = `${label}: ${format(Number(input.value))} ${unit}`;
  };
  updateLabel();

  input.addEventListener("input", () => {
    updateLabel();
    onInput(Number(input.value));
  });

  group.appendChild(input);
  controls.appendChild(group);
  return input;
}

function makeReadout(root, label) {
  const box = document.createElement("div");
  box.className = "sim-readout";
  const labelEl = document.createElement("span");
  labelEl.className = "sim-readout__label";
  labelEl.textContent = label;
  const valueEl = document.createElement("span");
  valueEl.className = "sim-readout__value";
  box.appendChild(labelEl);
  box.appendChild(valueEl);
  root.appendChild(box);
  return valueEl;
}

/**
 * Draws the F-vs-m plot: gridded axes, the line F = a·m through the
 * origin, the current (m, F) operating point, and a "slope = a" label
 * sitting on the line. Axis titles are kept clear of the tick numbers
 * (the y-title sits in its own gutter left of right-aligned y ticks).
 */
function drawPlot(canvas, { xMax, yMax, accel, point, frozen }) {
  const ctx = canvas.getContext("2d");
  const bg = cssVar("--sim-graph-bg", "#16213e");
  const grid = cssVar("--sim-graph-grid", "#2a3a5c");
  const textColor = cssVar("--sim-text", "#e0e0e0");
  const lineColor = cssVar("--sim-amber", "#f0c27a");
  const pointColor = cssVar("--sim-teal", "#48c9b0");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // padL leaves a gutter for the rotated y-title AND right-aligned ticks;
  // padB leaves two rows: tick numbers, then the x-title.
  const padL = 60, padB = 44, padT = 24, padR = 18;
  const plotW = canvas.width - padL - padR;
  const plotH = canvas.height - padT - padB;
  const xToPx = (x) => padL + (x / xMax) * plotW;
  const yToPx = (y) => padT + plotH - (Math.min(y, yMax) / yMax) * plotH;

  ctx.font = "12px sans-serif";
  ctx.textBaseline = "alphabetic";

  // grid + ticks
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const xv = (xMax / 4) * i;
    const px = xToPx(xv);
    ctx.beginPath();
    ctx.moveTo(px, padT);
    ctx.lineTo(px, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = textColor;
    const xt = xv.toFixed(0);
    ctx.fillText(xt, px - ctx.measureText(xt).width / 2, padT + plotH + 16);

    const yv = (yMax / 4) * i;
    const py = yToPx(yv);
    ctx.beginPath();
    ctx.moveTo(padL, py);
    ctx.lineTo(padL + plotW, py);
    ctx.stroke();
    const yt = yv.toFixed(0);
    ctx.fillText(yt, padL - 10 - ctx.measureText(yt).width, py + 4); // right-aligned, ends 10px left of the axis
  }

  // axis titles — x centered under the tick row, y rotated in the far-left gutter
  ctx.fillStyle = textColor;
  const xTitle = "mass  m  (kg)";
  ctx.fillText(xTitle, padL + plotW / 2 - ctx.measureText(xTitle).width / 2, padT + plotH + 36);
  ctx.save();
  ctx.translate(16, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  const yTitle = "net force  F  (N)";
  ctx.fillText(yTitle, -ctx.measureText(yTitle).width / 2, 0);
  ctx.restore();

  // the line F = a * m
  const xEndOnAxis = Math.min(xMax, yMax / accel); // clip where the line would leave the top of the plot
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = frozen ? 2 : 3;
  ctx.setLineDash(frozen ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(xToPx(0), yToPx(0));
  ctx.lineTo(xToPx(xEndOnAxis), yToPx(accel * xEndOnAxis));
  ctx.stroke();
  ctx.setLineDash([]);

  // "slope = a" callout, near the far end of the drawn line (away from
  // where the current-value dot usually sits)
  const labelX = xEndOnAxis * 0.72;
  const label = `slope = a = ${accel.toFixed(2)} m/s²`;
  ctx.font = "bold 12px sans-serif";
  const lw = ctx.measureText(label).width;
  let lx = xToPx(labelX) - lw - 10;
  if (lx < padL + 4) lx = padL + 4;
  const ly = yToPx(accel * labelX) - 12;
  ctx.fillStyle = bg;
  ctx.fillRect(lx - 5, ly - 12, lw + 10, 17);
  ctx.fillStyle = lineColor;
  ctx.fillText(label, lx, ly);

  // current operating point (m, F)
  ctx.font = "12px sans-serif";
  ctx.fillStyle = pointColor;
  ctx.beginPath();
  ctx.arc(xToPx(point.x), yToPx(point.y), 6, 0, Math.PI * 2);
  ctx.fill();

  if (frozen) {
    ctx.fillStyle = cssVar("--sim-red", "#ff6b6b");
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("PREDICTION LOCKED", padL + 4, padT - 8);
  }
}

function mount({ container, controls, promptEl, insightEl, readoutsEl, lockRowEl, graphsEl }) {
  const readoutsRoot = readoutsEl;
  const lockRow = lockRowEl;
  const graphsRoot = graphsEl;
  const graphWrap =
    container.querySelector('[data-graph="f-vs-m"]') ||
    container.querySelector(".interactive-panel__canvas-wrap");
  if (!graphWrap) return;

  const state = {
    mass: MASS_RANGE.initial,
    force: FORCE_RANGE.initial,
    locked: false,
    autoExploring: false,
    // last committed state actually shown on the graph (so Lock freezes the picture)
    shownMass: MASS_RANGE.initial,
    shownForce: FORCE_RANGE.initial,
  };

  const accelOf = (f, m) => f / m;

  // ---- readouts ----
  const massReadout = makeReadout(readoutsRoot, "Mass (m)");
  const forceReadout = makeReadout(readoutsRoot, "Net Force (F)");
  const accelReadout = makeReadout(readoutsRoot, "Acceleration (a)");

  function updateReadouts() {
    massReadout.textContent = `${state.mass.toFixed(1)} kg`;
    forceReadout.textContent = `${state.force.toFixed(0)} N`;
    accelReadout.textContent = `${accelOf(state.force, state.mass).toFixed(2)} m/s²`;
  }

  // ---- graph ----
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 240;
  canvas.style.width = "100%";
  canvas.style.height = "auto"; // scale to the 460x280 ratio, don't stretch to the wrapper
  canvas.style.display = "block";
  graphWrap.appendChild(canvas);

  function redraw() {
    const m = state.locked ? state.shownMass : state.mass;
    const f = state.locked ? state.shownForce : state.force;
    drawPlot(canvas, {
      xMax: MASS_RANGE.max,
      yMax: FORCE_RANGE.max,
      accel: accelOf(f, m),
      point: { x: m, y: f },
      frozen: state.locked,
    });
  }

  function commitShown() {
    state.shownMass = state.mass;
    state.shownForce = state.force;
  }

  function updateCopy() {
    if (promptEl) {
      promptEl.innerHTML = state.locked
        ? "🔒 <strong>Prediction locked.</strong> Move the sliders and say out loud what the line will do — steeper or shallower? — then press Unlock to check."
        : "🔓 <strong>Live.</strong> The line is <strong>F = a·m</strong>. Its steepness <em>is</em> the acceleration. Make the cart accelerate harder — which way does the line tip?";
    }
    if (insightEl) {
      const a = accelOf(state.force, state.mass);
      insightEl.innerHTML = `
        <p><strong>Slope = acceleration.</strong> Right now a = ${a.toFixed(2)} m/s², so the line rises ${a.toFixed(2)} N of force for every 1 kg of mass.</p>
        <p>More net force at the same mass ⇒ steeper line. More mass at the same net force ⇒ the point slides right and the line tips <em>down</em> (smaller a).</p>`;
    }
  }

  function onSlidersChanged() {
    updateReadouts();
    updateCopy();
    if (!state.locked) {
      commitShown();
      redraw();
    }
  }

  makeSlider({
    controls, key: "mass", label: "Mass", unit: "kg", range: MASS_RANGE,
    format: (v) => v.toFixed(1),
    onInput: (v) => { state.mass = v; onSlidersChanged(); },
  });
  makeSlider({
    controls, key: "force", label: "Net Force", unit: "N", range: FORCE_RANGE,
    format: (v) => v.toFixed(0),
    onInput: (v) => { state.force = v; onSlidersChanged(); },
  });

  // ---- Lock / Auto-Explore ----
  if (lockRow) {
    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "sim-lock-toggle";
    const setLockLabel = () => {
      lockBtn.textContent = `Lock graph: ${state.locked ? "ON" : "OFF"}`;
      lockBtn.dataset.locked = String(state.locked);
      if (graphsRoot) graphsRoot.dataset.locked = String(state.locked);
    };
    setLockLabel();
    lockBtn.addEventListener("click", () => {
      state.locked = !state.locked;
      setLockLabel();
      updateCopy();
      if (!state.locked) { commitShown(); redraw(); }
      else redraw();
    });
    lockRow.appendChild(lockBtn);

    const autoBtn = document.createElement("button");
    autoBtn.type = "button";
    let rafId = null;
    const massInput = controls.querySelector("#fx-mass");
    const forceInput = controls.querySelector("#fx-force");
    const setAutoLabel = () => { autoBtn.textContent = `Auto-explore: ${state.autoExploring ? "ON" : "OFF"}`; };
    setAutoLabel();

    function stopAuto() {
      state.autoExploring = false;
      setAutoLabel();
      if (rafId) cancelAnimationFrame(rafId);
    }
    function sweep(input, from, to, ms, apply) {
      return new Promise((resolve) => {
        const start = performance.now();
        function frame(now) {
          if (!state.autoExploring) return resolve();
          const t = Math.min(1, (now - start) / ms);
          const value = from + (to - from) * t;
          input.value = String(value);
          apply(value);
          onSlidersChanged();
          if (t < 1) rafId = requestAnimationFrame(frame);
          else resolve();
        }
        rafId = requestAnimationFrame(frame);
      });
    }
    autoBtn.addEventListener("click", async () => {
      if (state.autoExploring) { stopAuto(); return; }
      state.autoExploring = true;
      setAutoLabel();
      if (state.locked) { state.locked = false; setLockLabel(); }
      await sweep(forceInput, FORCE_RANGE.min, FORCE_RANGE.max, AUTO_EXPLORE_PHASE_MS, (v) => (state.force = v));
      if (!state.autoExploring) return;
      await sweep(massInput, MASS_RANGE.min, MASS_RANGE.max, AUTO_EXPLORE_PHASE_MS, (v) => (state.mass = v));
      stopAuto();
    });
    lockRow.appendChild(autoBtn);
  }

  updateReadouts();
  updateCopy();
  commitShown();
  // register() re-runs `redraw` on slide:shown (canvas can have zero
  // layout size while the slide is hidden) and on resize.
  return redraw;
}

window.PA.panel.register("newtons-second-law-explorer", mount);
})();
