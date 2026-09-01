/**
 * Friction Explorer for the "Friction: Static and Kinetic" lesson
 * (C2.8 / CED topic 2.7). Registered through window.PA.panel.
 *
 * A block on a level floor. The student sets the applied push, the mass,
 * and the two coefficients. The friction arrow GROWS to match the push
 * while the block stays put (static friction, f = F_app), then snaps to
 * the shorter, constant kinetic value the instant the push exceeds
 * mu_s * F_N — and the block accelerates.
 *
 * Plain <script>, not an ES module (see js/content-loader.js).
 */
(function () {
  const { cssVar, arrow, register } = window.PA.panel;
  const G = 9.8;

  function slider(controls, { key, label, unit, min, max, step, value, fmt }) {
    const wrap = document.createElement("label");
    wrap.className = "fx2__row";
    const name = document.createElement("span");
    name.className = "fx2__name";
    name.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("aria-label", label + " in " + unit);
    const out = document.createElement("span");
    out.className = "fx2__val";
    const show = () => (out.textContent = (fmt ? fmt(Number(input.value)) : input.value) + " " + unit);
    show();
    wrap.append(name, input, out);
    controls.appendChild(wrap);
    return { input, show };
  }

  function mount({ controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;

    const state = { F: 20, m: 5, mus: 0.5, muk: 0.3 };

    const stage = document.createElement("div");
    stage.className = "fx2__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 220;
    canvas.setAttribute("role", "img");
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    const s1 = slider(controls, { key: "F", label: "Applied push", unit: "N", min: 0, max: 60, step: 1, value: state.F });
    const s2 = slider(controls, { key: "m", label: "Mass", unit: "kg", min: 1, max: 12, step: 0.5, value: state.m });
    const s3 = slider(controls, { key: "mus", label: "μₛ (static)", unit: "", min: 0.1, max: 1, step: 0.05, value: state.mus, fmt: (v) => v.toFixed(2) });
    const s4 = slider(controls, { key: "muk", label: "μₖ (kinetic)", unit: "", min: 0.05, max: 0.95, step: 0.05, value: state.muk, fmt: (v) => v.toFixed(2) });
    s1.input.addEventListener("input", () => { state.F = +s1.input.value; s1.show(); draw(); });
    s2.input.addEventListener("input", () => { state.m = +s2.input.value; s2.show(); draw(); });
    s3.input.addEventListener("input", () => {
      state.mus = +s3.input.value;
      if (state.muk > state.mus) { state.muk = state.mus; s4.input.value = String(state.muk); s4.show(); }
      s3.show(); draw();
    });
    s4.input.addEventListener("input", () => {
      state.muk = Math.min(+s4.input.value, state.mus);
      s4.input.value = String(state.muk);
      s4.show(); draw();
    });

    const verdict = document.createElement("div");
    verdict.className = "fx2__verdict";
    (promptEl || controls).appendChild(verdict);

    function model() {
      const FN = state.m * G;
      const fsMax = state.mus * FN;
      const fk = state.muk * FN;
      const slipping = state.F > fsMax;
      const f = slipping ? fk : state.F;
      const a = slipping ? (state.F - fk) / state.m : 0;
      return { FN, fsMax, fk, slipping, f, a };
    }

    function draw() {
      const M = model();
      const ink = cssVar("--sim-text", "#e0e0e0");
      const muted = cssVar("--sim-graph-grid", "#2a3a5c");
      const cA = cssVar("--sim-amber", "#f0c27a");
      const cN = cssVar("--sim-blue", "#58a6ff");
      const cG = cssVar("--sim-grey", "#8b96a5");
      const cF = cssVar("--sim-red", "#ff6b6b");
      ctx.fillStyle = cssVar("--sim-graph-bg", "#16213e");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = 210, cy = 120, hw = 34, hh = 22;
      // floor
      ctx.strokeStyle = "#3a4a6c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, cy + hh);
      ctx.lineTo(440, cy + hh);
      ctx.stroke();
      for (let x = 48; x < 440; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, cy + hh);
        ctx.lineTo(x - 7, cy + hh + 8);
        ctx.stroke();
      }
      // block
      ctx.strokeStyle = ink;
      ctx.fillStyle = "rgba(230,237,243,0.05)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
      ctx.fill();
      ctx.stroke();

      const px = (n) => 3 + n * 3.0; // N -> px, shared scale for F_app and f

      // gravity + normal (fixed reference length)
      arrow(ctx, cx + 10, cy, cx + 10, cy + 44, cG, { width: 3, head: 9, tailDot: true });
      arrow(ctx, cx - 12, cy + hh, cx - 12, cy + hh - 44, cN, { width: 3, head: 9, tailDot: true });
      label("F_g", cx + 16, cy + 52, cG);
      label("F_N", cx - 18, cy + hh - 52, cN);

      // applied push — from the left face
      if (state.F > 0.5) {
        arrow(ctx, cx - hw, cy - 6, cx - hw + px(state.F), cy - 6, cA, { width: 3.5, head: 11, tailDot: true });
        label("F_app = " + state.F.toFixed(0) + " N", cx - hw + px(state.F) + 6, cy - 12, cA, "left");
      }
      // friction — along the floor, opposing the push
      if (M.f > 0.5) {
        arrow(ctx, cx + hw, cy + hh, cx + hw - px(M.f), cy + hh, cF, { width: 3.5, head: 11, tailDot: true });
        label((M.slipping ? "f_k = " : "f_s = ") + M.f.toFixed(0) + " N", cx + hw - px(M.f) - 6, cy + hh + 14, cF, "end");
      }

      // verdict badge
      verdict.className = "fx2__verdict " + (M.slipping ? "is-slip" : "is-stay");
      verdict.innerHTML = M.slipping
        ? "<strong>SLIDES.</strong> The push (" + state.F.toFixed(0) +
          " N) beat the most static friction can give ( μₛ Fₙ = " + M.fsMax.toFixed(0) +
          " N ). Now friction is kinetic and fixed at μₖ Fₙ = " + M.fk.toFixed(0) +
          " N, so a = (F−fₖ)/m = " + M.a.toFixed(1) + " m/s²."
        : "<strong>STAYS PUT.</strong> Static friction has grown to exactly match the push (fₛ = " +
          state.F.toFixed(0) + " N), up to its limit μₛ Fₙ = " + M.fsMax.toFixed(0) +
          " N. Net force zero, a = 0.";
    }

    function label(sym, x, y, color, align) {
      const m = /^([A-Za-z]+)_(.+)$/.exec(sym);
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.textAlign = align || "center";
      if (m) {
        ctx.font = "600 13px system-ui, sans-serif";
        const mainW = ctx.measureText(m[1]).width;
        const sub = m[2];
        let bx = x;
        if (align === "end") bx = x - (mainW + 5);
        else if (!align || align === "center") bx = x - (mainW + 5) / 2;
        ctx.textAlign = "left";
        ctx.fillText(m[1], bx, y);
        ctx.font = "600 9px system-ui, sans-serif";
        ctx.fillText(sub, bx + mainW + 1, y + 3);
      } else {
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillText(sym, x, y);
      }
      ctx.textAlign = "center";
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p><strong>Static friction is whatever it needs to be</strong> — up to a maximum of μₛ Fₙ — to keep the object still. Push harder and it pushes back just as hard, until it can't. <strong>Kinetic friction is a fixed number</strong>, μₖ Fₙ, that does not care how hard you push.</p><p>Find Fₙ first (here it is <em>mg</em> because the push is horizontal), then the friction, then Newton's second law along the floor.</p>";
    }

    return draw;
  }

  register("friction-explorer", mount);
})();
