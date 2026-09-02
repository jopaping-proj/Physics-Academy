/**
 * Circular Motion Explorer for the "Circular Motion" lesson
 * (C2.12 / CED topic 2.9). Registered through window.PA.panel.
 *
 * Top-down view of a puck on a string, whirled in a horizontal circle
 * on a frictionless table. The string is the ONLY horizontal force, so
 * it must supply the whole centripetal requirement F_c = m v^2 / r.
 *
 *   - the velocity vector is drawn TANGENT to the circle (constant in
 *     size, always changing direction);
 *   - the acceleration vector is drawn RADIALLY INWARD, magnitude v^2/r;
 *   - the string tension equals F_c.
 *
 * When the required F_c exceeds the string's breaking tension, the
 * string snaps and the puck slides off along the TANGENT (a straight
 * line — no outward force ever acted on it) at constant speed.
 *
 * Plain <script>, not an ES module (see js/content-loader.js).
 */
(function () {
  const { cssVar, arrow, register } = window.PA.panel;

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
    input.setAttribute("aria-label", label + (unit ? " in " + unit : ""));
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
    const state = { v: 4, r: 0.8, m: 0.5, Tmax: 20 };

    const stage = document.createElement("div");
    stage.className = "fx2__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 460;
    canvas.height = 300;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Top-down view of a puck on a string moving in a circle, with its velocity vector tangent to the circle and its acceleration vector pointing to the centre.");
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    const sV = slider(controls, { label: "Speed v", min: 1, max: 10, step: 0.5, value: state.v, unit: "m/s", fmt: (x) => x.toFixed(1) });
    const sR = slider(controls, { label: "Radius r", min: 0.3, max: 1.5, step: 0.1, value: state.r, unit: "m", fmt: (x) => x.toFixed(1) });
    const sM = slider(controls, { label: "Mass m", min: 0.1, max: 1.0, step: 0.1, value: state.m, unit: "kg", fmt: (x) => x.toFixed(1) });
    const sT = slider(controls, { label: "String breaks at", min: 5, max: 60, step: 5, value: state.Tmax, unit: "N" });
    sV.input.addEventListener("input", () => { state.v = +sV.input.value; sV.show(); resetPhase(); });
    sR.input.addEventListener("input", () => { state.r = +sR.input.value; sR.show(); resetPhase(); });
    sM.input.addEventListener("input", () => { state.m = +sM.input.value; sM.show(); });
    sT.input.addEventListener("input", () => { state.Tmax = +sT.input.value; sT.show(); });

    const verdict = document.createElement("div");
    verdict.className = "fx2__verdict";
    (promptEl || controls).appendChild(verdict);

    const CX = 232, CY = 150;      // centre of the circle (px)
    const PX_PER_M = 92;           // metres -> px for the radius (r 0.3..1.5 -> 28..138 px)
    const V_SCALE = 9;             // m/s   -> px for the velocity arrow
    const A_SCALE = 2.2;           // m/s^2 -> px for the acceleration arrow (capped)

    let phase = 0;                 // angular position of the puck (rad)
    let broken = false;
    let flyT = 0;                  // seconds since the string broke
    let last = 0;
    let raf = 0;

    function model() {
      const ac = (state.v * state.v) / state.r;   // m/s^2
      const Fc = state.m * ac;                     // N  (= string tension needed)
      const willBreak = Fc > state.Tmax + 1e-9;
      return { ac, Fc, willBreak };
    }

    function resetPhase() {
      broken = false;
      flyT = 0;
    }

    function frame(t) {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05;

      const M = model();
      // visual angular speed, gently clamped so tiny radii don't blur
      const omega = Math.min(state.v / state.r, 6);

      if (!broken) {
        phase += omega * dt;
        if (M.willBreak && Math.random() < dt * 2.5) { broken = true; flyT = 0; }
      } else {
        flyT += dt;
        if (flyT > 2.0) resetPhase();
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      const M = model();
      const bg = cssVar("--sim-graph-bg", "#16213e");
      const ink = cssVar("--sim-text", "#e0e0e0");
      const grid = cssVar("--sim-graph-grid", "#2a3a5c");
      const cV = cssVar("--sim-green", "#51cf66");
      const cA = cssVar("--sim-amber", "#f0c27a");
      const cT = cssVar("--sim-blue", "#58a6ff");
      const cBreak = cssVar("--sim-red", "#ff6b6b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rpx = state.r * PX_PER_M;

      // circular path
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(CX, CY, rpx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // centre peg
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(CX, CY, 3, 0, Math.PI * 2);
      ctx.fill();

      // puck position
      const px = CX + rpx * Math.cos(phase);
      const py = CY + rpx * Math.sin(phase);
      // tangent unit vector (direction of motion, counter-clockwise screen = +phase)
      const tx = -Math.sin(phase), ty = Math.cos(phase);
      // inward unit vector
      const ix = -Math.cos(phase), iy = -Math.sin(phase);

      if (!broken) {
        // string
        ctx.strokeStyle = cT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // acceleration (radially inward), magnitude capped for display
        const aLen = Math.min(M.ac * A_SCALE, rpx - 6);
        arrow(ctx, px, py, px + ix * aLen, py + iy * aLen, cA, { width: 3, head: 9, tailDot: true });
        labelAt("a", px + ix * aLen * 0.5 + 8, py + iy * aLen * 0.5, cA);

        // velocity (tangent)
        const vLen = state.v * V_SCALE;
        arrow(ctx, px, py, px + tx * vLen, py + ty * vLen, cV, { width: 3, head: 9, tailDot: true });
        labelAt("v", px + tx * vLen + 8, py + ty * vLen, cV);

        // string label, parked at the midpoint of the string, nudged off the line
        const mxs = (CX + px) / 2, mys = (CY + py) / 2;
        ctx.fillStyle = cT;
        ctx.font = "600 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("string: T = F_c", mxs, mys - 8);
      } else {
        // flew off along the tangent from the break point
        const bx0 = CX + rpx * Math.cos(phase);
        const by0 = CY + rpx * Math.sin(phase);
        const dist = Math.min(state.v * 16 * flyT, 200); // steady, kept on-canvas
        const fx = bx0 + tx * dist;
        const fy = by0 + ty * dist;
        ctx.strokeStyle = cBreak;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx0, by0);
        ctx.lineTo(fx, fy);
        ctx.stroke();
        ctx.setLineDash([]);
        // puck now here
        const vLen = state.v * V_SCALE;
        arrow(ctx, fx, fy, fx + tx * vLen, fy + ty * vLen, cV, { width: 3, head: 9, tailDot: true });
        labelAt("v", fx + tx * vLen + 8, fy + ty * vLen, cV);
        ctx.fillStyle = cBreak;
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("string snapped — straight line, constant speed", canvas.width / 2, 20);
        // draw the puck at the flown position instead of on the circle
        drawPuck(fx, fy);
      }

      if (!broken) drawPuck(px, py);

      // verdict / readout
      const eqn = "F_c = m v² / r = " + state.m.toFixed(1) + " × " + state.v.toFixed(1) + "² / " + state.r.toFixed(1) +
        " = <b>" + M.Fc.toFixed(1) + " N</b>";
      if (M.willBreak) {
        verdict.className = "fx2__verdict is-slip";
        verdict.innerHTML = "<strong>STRING BREAKS.</strong> " + eqn +
          ", which is more than the string can hold (" + state.Tmax + " N). " +
          "With no force left, the puck travels in a <b>straight line at constant speed</b> along the tangent — it does <em>not</em> fly radially outward.";
      } else {
        verdict.className = "fx2__verdict is-stay";
        verdict.innerHTML = "<strong>HOLDS.</strong> " + eqn +
          " (≤ " + state.Tmax + " N). The string tension is the whole centripetal force. " +
          "a<sub>c</sub> = v²/r = " + M.ac.toFixed(1) + " m/s², directed at the centre; the speed is constant but the velocity keeps turning.";
      }
    }

    function drawPuck(x, y) {
      ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.strokeStyle = cssVar("--sim-graph-bg", "#16213e");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    function labelAt(sym, x, y, color) {
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(sym, x, y);
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p><strong>Uniform circular motion:</strong> the speed is constant, but the velocity is always changing direction, so there <em>is</em> an acceleration — pointing at the centre, size v²/r.</p>" +
        "<p>That acceleration is produced by the <strong>real</strong> forces (here, the string tension). \"Centripetal force\" is not an extra arrow — it is the name for the net inward force the real ones already add up to. When they can't supply enough, the object simply goes straight.</p>";
    }

    // clean up any previous loop if this mounts twice, then start
    if (window.__cme_raf) cancelAnimationFrame(window.__cme_raf);
    raf = requestAnimationFrame(frame);
    window.__cme_raf = raf;

    return function redraw() {
      window.__cme_raf = raf;
      draw();
    };
  }

  register("circular-motion-explorer", mount);
})();
