/**
 * "Cart on a Track" simulation for the Newton's Second Law prototype
 * lesson (master-project-prompt.md §14; addendum §10's Predict → Commit
 * → Manipulate → Observe → Explain → Generalize flow, via
 * initSimulationChrome's prediction gate).
 *
 * A cart starts at rest on a horizontal track and accelerates under a
 * constant applied force; an optional kinetic-friction term can oppose
 * that force. Physics is plain 1D kinematics, integrated with a fixed
 * timestep so motion is deterministic regardless of the browser's
 * actual frame rate. No external library — everything is drawn with
 * the Canvas 2D API.
 *
 * The side panel graph plots net force F against mass m (revised
 * 2026-08-31, was a velocity-time graph): the origin line F = a*m has
 * SLOPE equal to this cart's acceleration, matching the "slope =
 * acceleration" reading the Formula Explorer teaches. Move the sliders
 * and the line tips; the dot is this cart's current (m, F_net).
 *
 * ---- Quick tuning guide ----
 *   MASS_RANGE / FORCE_RANGE / FRICTION_RANGE  — slider bounds/steps
 *   G                                          — gravity, m/s²
 *   TRACK_LENGTH_M                             — visible track length
 *   FIXED_DT                                   — physics step size
 *   Colors are all read from CSS custom properties (--sim-*, see
 *   css/variables.css) rather than hard-coded here, so the palette can
 *   be restyled sitewide without touching this file.
 *
 * Plain script, not an ES module (see js/content-loader.js for why) —
 * wrapped in an IIFE and reaching its two dependencies via the shared
 * window.PA namespace. js/simulations.js and js/content-loader.js
 * must both be loaded (as plain <script> tags) before this file.
 */
(function () {
const initSimulationChrome = window.PA.simulations.initSimulationChrome;
const getLessonData = window.PA.contentLoader.getLessonData;

const G = 9.8;
const TRACK_LENGTH_M = 20;
const FIXED_DT = 1 / 60; // physics tick, seconds — matches the ~16 ms/60fps spec
const STEP_DT = 0.1; // seconds advanced by one press of the Step button

const MASS_RANGE = { min: 0.5, max: 10, step: 0.5, initial: 2 };
// Force range goes well above the friction forces in play so a student
// can dial the push from "too weak to move it" up through "breaks free
// and accelerates" and see both.
const FORCE_RANGE = { min: 1, max: 20, step: 1, initial: 8 };
// The slider sets the KINETIC coefficient; the maximum STATIC friction
// is a bit larger (μ_s = MU_S_RATIO · μ_k) — the standard textbook
// picture, and what stops a small push from producing a negative
// "velocity" when friction is on.
const FRICTION_RANGE = { min: 0.05, max: 0.3, step: 0.05, initial: 0.15 };
const MU_S_RATIO = 1.3;

const TRACK_MARGIN = 40;
const CART_W = 50;
const CART_H = 30;
const FORCE_ARROW_MAX = 90; // px, visual cap so a large net force doesn't run off-canvas
const VELOCITY_ARROW_MAX = 220; // px, visual cap for the velocity vector

function cssVar(name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  if (Math.hypot(x2 - x1, y2 - y1) < 1) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function makeSlider({ controls, key, label, unit, range, format, onChange }) {
  const group = document.createElement("div");
  group.className = "interactive-panel__slider-group";

  const labelEl = document.createElement("label");
  labelEl.setAttribute("for", `cart-${key}`);
  group.appendChild(labelEl);

  const input = document.createElement("input");
  input.type = "range";
  input.id = `cart-${key}`;
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
    onChange(Number(input.value));
  });

  group.appendChild(input);
  controls.appendChild(group);
  return group;
}

function mount(container) {
  const trackWrap = container.querySelector('[data-role="track"]');
  const graphWrap = container.querySelector('[data-role="graph"]');
  const controls = container.querySelector(".interactive-panel__controls");
  if (!trackWrap || !graphWrap || !controls) return;

  // ---- physics state ----
  const state = {
    mass: MASS_RANGE.initial,
    force: FORCE_RANGE.initial,
    frictionOn: false,
    mu: FRICTION_RANGE.initial,
    t: 0,
    x: 0,
    v: 0,
    playing: false,
    stopped: false, // true once the cart has reached the right edge
    accumulator: 0,
    lastTs: null,
    rafId: null,
  };

  const normalForce = () => state.mass * G;
  const kineticFriction = () => (state.frictionOn ? state.mu * normalForce() : 0);
  const maxStaticFriction = () => (state.frictionOn ? state.mu * MU_S_RATIO * normalForce() : 0);

  /**
   * The cart's force situation *right now*, which depends on whether it
   * is already sliding:
   *   - Moving  → kinetic friction (μ_k·F_N) opposes the motion, so
   *               F_net = F_applied − μ_k·F_N  (can be negative → the
   *               cart decelerates and eventually stops).
   *   - At rest → static friction rises to exactly cancel the applied
   *               force, up to its maximum μ_s·F_N. Below that maximum
   *               the cart stays put (F_net = 0, `held` = true); above
   *               it the cart breaks free and kinetic friction takes
   *               over.
   * This is what keeps a too-small push from producing a spurious
   * backward velocity when friction is on.
   */
  function forceState() {
    const applied = state.force; // always rightward, ≥ 0
    if (state.v > 1e-6) {
      return { fNet: applied - kineticFriction(), held: false };
    }
    if (applied <= maxStaticFriction()) {
      return { fNet: 0, held: true };
    }
    return { fNet: applied - kineticFriction(), held: false };
  }

  const netForce = () => forceState().fNet;
  const acceleration = () => forceState().fNet / state.mass;

  /** Advances the simulation by exactly `dt` seconds (semi-implicit
   * Euler: velocity updates first, then position uses the new
   * velocity). Velocity is clamped at 0 — a decelerating cart stops,
   * it does not reverse — and once stopped, `forceState()` re-checks
   * the static-friction condition on the next tick. */
  function physicsStep(dt) {
    if (state.stopped) return;

    const a = acceleration();
    let newV = state.v + a * dt;
    if (newV < 0) newV = 0;
    state.v = newV;
    state.x += state.v * dt;
    state.t += dt;

    if (state.x >= TRACK_LENGTH_M) {
      state.x = TRACK_LENGTH_M;
      state.v = 0;
      state.stopped = true;
      state.playing = false;
    }
  }

  // ---- track (side-view) rendering ----
  const trackCanvas = document.createElement("canvas");
  trackCanvas.width = 640;
  trackCanvas.height = 300;
  trackCanvas.style.width = "100%";
  trackCanvas.style.height = "100%";
  trackCanvas.style.display = "block";
  trackWrap.appendChild(trackCanvas);
  const tctx = trackCanvas.getContext("2d");

  function drawTrack() {
    const { fNet: netF, held } = forceState();
    const a = netF / state.mass;
    const bg = cssVar("--sim-bg", "#1a1a2e");
    const trackColor = cssVar("--sim-panel", "#2d2d44");
    const cartColor = cssVar("--sim-cart", "#e6b800");
    const forceColor = cssVar("--sim-red", "#ff6b6b");
    const velocityColor = cssVar("--sim-green", "#51cf66");
    const textColor = cssVar("--sim-text", "#e0e0e0");

    tctx.fillStyle = bg;
    tctx.fillRect(0, 0, trackCanvas.width, trackCanvas.height);

    const trackY = trackCanvas.height * 0.7;
    tctx.strokeStyle = trackColor;
    tctx.lineWidth = 6;
    tctx.beginPath();
    tctx.moveTo(TRACK_MARGIN, trackY);
    tctx.lineTo(trackCanvas.width - TRACK_MARGIN, trackY);
    tctx.stroke();

    const pxPerMeter = (trackCanvas.width - 2 * TRACK_MARGIN - CART_W) / TRACK_LENGTH_M;
    const cartLeft = TRACK_MARGIN + Math.min(state.x, TRACK_LENGTH_M) * pxPerMeter;

    tctx.fillStyle = cartColor;
    tctx.fillRect(cartLeft, trackY - CART_H, CART_W, CART_H);

    // Net-force vector: red, from the cart's centre, direction follows
    // the sign of F_net (kinetic friction can make it negative). When
    // static friction is holding the cart, F_net is exactly zero — draw
    // no arrow, just say so.
    const forceLen = Math.min(FORCE_ARROW_MAX, 12 + Math.abs(netF) * 8);
    const forceDir = netF >= 0 ? 1 : -1;
    if (!held && Math.abs(netF) > 1e-6) {
      tctx.globalAlpha = 0.85;
      drawArrow(
        tctx,
        cartLeft + CART_W / 2,
        trackY - CART_H / 2,
        cartLeft + CART_W / 2 + forceDir * forceLen,
        trackY - CART_H / 2,
        forceColor
      );
    }

    // Velocity vector: green, above the cart, always rightward (v is never negative).
    if (state.v > 0.01) {
      const velLen = Math.min(VELOCITY_ARROW_MAX, state.v * 10);
      drawArrow(
        tctx,
        cartLeft + CART_W / 2,
        trackY - CART_H - 15,
        cartLeft + CART_W / 2 + velLen,
        trackY - CART_H - 15,
        velocityColor
      );
    }
    tctx.globalAlpha = 1;

    tctx.fillStyle = textColor;
    tctx.font = "0.875rem sans-serif";
    tctx.fillText(
      `t = ${state.t.toFixed(2)} s   v = ${state.v.toFixed(2)} m/s   a = ${a >= 0 ? "+" : ""}${a.toFixed(2)} m/s²   x = ${state.x.toFixed(2)} m`,
      TRACK_MARGIN,
      22
    );
    tctx.fillStyle = forceColor;
    tctx.fillText("— net force", trackCanvas.width - TRACK_MARGIN - 90, 22);
    tctx.fillStyle = velocityColor;
    tctx.fillText("— velocity", trackCanvas.width - TRACK_MARGIN - 90, 42);

    if (state.stopped) {
      tctx.fillStyle = velocityColor;
      tctx.font = "0.8rem sans-serif";
      tctx.fillText("Cart reached the end of the track — press Reset to run again.", TRACK_MARGIN, 60);
    } else if (held) {
      tctx.fillStyle = cssVar("--sim-amber", "#f0c27a");
      tctx.font = "0.8rem sans-serif";
      tctx.fillText(
        `Held by static friction — F_net = 0  (push ${state.force.toFixed(0)} N < max static ${maxStaticFriction().toFixed(0)} N)`,
        TRACK_MARGIN,
        60
      );
    }
  }

  // ---- F-vs-m graph rendering (hand-rolled, no charting library) ----
  // Net force F on the y-axis, mass m on the x-axis. The line through
  // the origin is F = a*m, so its SLOPE is this cart's acceleration —
  // the same "slope = acceleration" idea the Formula Explorer teaches.
  // The dot marks this cart's current (m, F_net). Change the sliders
  // and watch the line tip: steeper line = harder acceleration.
  const graphCanvas = document.createElement("canvas");
  graphCanvas.width = 480;
  graphCanvas.height = 300;
  graphCanvas.style.width = "100%";
  graphCanvas.style.height = "100%";
  graphCanvas.style.display = "block";
  graphWrap.appendChild(graphCanvas);
  const gctx = graphCanvas.getContext("2d");

  function drawGraph() {
    const bg = cssVar("--sim-graph-bg", "#16213e");
    const grid = cssVar("--sim-graph-grid", "#2a3a5c");
    const lineColor = cssVar("--sim-amber", "#f0c27a");
    const pointColor = cssVar("--sim-teal", "#48c9b0");
    const textColor = cssVar("--sim-text", "#e0e0e0");

    gctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    gctx.fillStyle = bg;
    gctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

    const padL = 58, padB = 44, padT = 22, padR = 16;
    const plotW = graphCanvas.width - padL - padR;
    const plotH = graphCanvas.height - padT - padB;

    const xMax = MASS_RANGE.max; // kg
    const yMax = FORCE_RANGE.max; // N (applied-force range; net force never exceeds it)
    const xToPx = (m) => padL + (m / xMax) * plotW;
    const yToPx = (f) => padT + plotH - (Math.max(0, Math.min(f, yMax)) / yMax) * plotH;

    const { fNet, held } = forceState();
    const a = fNet / state.mass;

    gctx.font = "12px sans-serif";
    gctx.textBaseline = "alphabetic";

    // grid + ticks
    gctx.strokeStyle = grid;
    gctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const xv = (xMax / 4) * i;
      const px = xToPx(xv);
      gctx.beginPath();
      gctx.moveTo(px, padT);
      gctx.lineTo(px, padT + plotH);
      gctx.stroke();
      gctx.fillStyle = textColor;
      const xt = xv.toFixed(0);
      gctx.fillText(xt, px - gctx.measureText(xt).width / 2, padT + plotH + 16);

      const yv = (yMax / 4) * i;
      const py = yToPx(yv);
      gctx.beginPath();
      gctx.moveTo(padL, py);
      gctx.lineTo(padL + plotW, py);
      gctx.stroke();
      const yt = yv.toFixed(0);
      gctx.fillText(yt, padL - 10 - gctx.measureText(yt).width, py + 4);
    }

    // axis titles, clear of the tick numbers
    gctx.fillStyle = textColor;
    const xTitle = "mass  m  (kg)";
    gctx.fillText(xTitle, padL + plotW / 2 - gctx.measureText(xTitle).width / 2, padT + plotH + 36);
    gctx.save();
    gctx.translate(15, padT + plotH / 2);
    gctx.rotate(-Math.PI / 2);
    const yTitle = "net force  F  (N)";
    gctx.fillText(yTitle, -gctx.measureText(yTitle).width / 2, 0);
    gctx.restore();

    // the line F = a*m (clip where it would leave the top of the plot)
    if (a > 0) {
      const xEnd = Math.min(xMax, yMax / a);
      gctx.strokeStyle = lineColor;
      gctx.lineWidth = 3;
      gctx.beginPath();
      gctx.moveTo(xToPx(0), yToPx(0));
      gctx.lineTo(xToPx(xEnd), yToPx(a * xEnd));
      gctx.stroke();

      const labelX = xEnd * 0.72;
      const label = `slope = a = ${a.toFixed(2)} m/s²`;
      gctx.font = "bold 12px sans-serif";
      const lw = gctx.measureText(label).width;
      let lx = xToPx(labelX) - lw - 10;
      if (lx < padL + 4) lx = padL + 4;
      const ly = yToPx(a * labelX) - 12;
      gctx.fillStyle = bg;
      gctx.fillRect(lx - 5, ly - 12, lw + 10, 17);
      gctx.fillStyle = lineColor;
      gctx.fillText(label, lx, ly);
      gctx.font = "12px sans-serif";
    }

    // current (m, F_net) point for this cart
    gctx.fillStyle = pointColor;
    gctx.beginPath();
    gctx.arc(xToPx(state.mass), yToPx(fNet), 6, 0, Math.PI * 2);
    gctx.fill();
    gctx.fillStyle = textColor;
    gctx.fillText(
      held
        ? `this cart: held by static friction — F_net = 0, a = 0`
        : `this cart:  m = ${state.mass.toFixed(1)} kg,  F_net = ${fNet.toFixed(1)} N`,
      padL + 4,
      padT - 8
    );
  }

  function draw() {
    drawTrack();
    drawGraph();
  }

  // ---- controls: mass, applied force, friction toggle + slider ----
  makeSlider({
    controls,
    key: "mass",
    label: "Mass",
    unit: "kg",
    range: MASS_RANGE,
    format: (v) => v.toFixed(1),
    onChange: (v) => {
      state.mass = v;
      draw();
    },
  });

  makeSlider({
    controls,
    key: "force",
    label: "Force",
    unit: "N",
    range: FORCE_RANGE,
    format: (v) => v.toFixed(0),
    onChange: (v) => {
      state.force = v;
      draw();
    },
  });

  const frictionCheckboxLabel = document.createElement("label");
  frictionCheckboxLabel.className = "interactive-panel__checkbox";
  const frictionCheckbox = document.createElement("input");
  frictionCheckbox.type = "checkbox";
  frictionCheckboxLabel.appendChild(frictionCheckbox);
  frictionCheckboxLabel.appendChild(document.createTextNode("Friction ON"));
  controls.appendChild(frictionCheckboxLabel);

  const frictionSliderGroup = makeSlider({
    controls,
    key: "friction",
    label: "μₖ (kinetic; max static = 1.3 μₖ)",
    unit: "",
    range: FRICTION_RANGE,
    format: (v) => v.toFixed(2),
    onChange: (v) => {
      state.mu = v;
      draw();
    },
  });
  frictionSliderGroup.hidden = true; // only shown once "Friction ON" is checked

  frictionCheckbox.addEventListener("change", () => {
    state.frictionOn = frictionCheckbox.checked;
    frictionSliderGroup.hidden = !state.frictionOn;
    draw();
  });

  // ---- play / pause / step / reset chrome ----
  function loop(ts) {
    if (!state.playing) return;
    if (state.lastTs == null) state.lastTs = ts;
    state.accumulator += (ts - state.lastTs) / 1000;
    state.lastTs = ts;

    while (state.accumulator >= FIXED_DT && !state.stopped) {
      physicsStep(FIXED_DT);
      state.accumulator -= FIXED_DT;
    }
    draw();

    if (state.stopped) return; // auto-stop at the track's edge, no further frames scheduled
    state.rafId = requestAnimationFrame(loop);
  }

  const lesson = getLessonData();

  initSimulationChrome(container, {
    predictionPrompt: lesson?.simulation?.predictionPrompt,
    onPlay: () => {
      if (state.stopped) return;
      state.playing = true;
      state.lastTs = null;
      state.rafId = requestAnimationFrame(loop);
    },
    onPause: () => {
      state.playing = false;
      if (state.rafId) cancelAnimationFrame(state.rafId);
    },
    onStep: () => {
      if (state.playing) return; // Step is a paused-only control, per spec
      physicsStep(STEP_DT);
      draw();
    },
    onReset: () => {
      state.playing = false;
      state.stopped = false;
      state.t = 0;
      state.x = 0;
      state.v = 0;
      state.accumulator = 0;
      state.lastTs = null;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      draw();
    },
  });

  // redraw when this slide becomes visible in the deck (the canvas may
  // have had zero layout size while its slide was hidden)
  const slide = container.closest(".slide");
  if (slide) slide.addEventListener("slide:shown", draw);

  draw();
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector('[data-component-key="cart-force-mass"]');
  if (container) mount(container);
});
})();
