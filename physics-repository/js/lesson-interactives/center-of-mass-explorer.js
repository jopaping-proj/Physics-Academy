/**
 * Center-of-Mass Explorer for the "Systems and Center of Mass" lesson
 * (C2.11 / CED topic 2.1). Self-mounts on DOMContentLoaded into the
 * [data-component-key="center-of-mass-explorer"] section.
 *
 * Two masses sit on a track. The student drags them and sets their
 * masses; a ★ marker shows the mass-weighted average position live.
 * Two experiments:
 *   - "External push"  — a force from outside acts on one mass; the
 *     center of mass accelerates (F_net,ext = M a_cm).
 *   - "Internal explosion" — the masses shove EACH OTHER apart; they
 *     fly off but the center of mass does not move at all.
 *
 * Plain script, IIFE, Canvas 2D. See js/content-loader.js for why this
 * is not an ES module.
 */
(function () {
  const X_MIN = 0;
  const X_MAX = 10; // track units ("metres")
  const PAD = 42; // px inset on each side of the track

  const cssVar = window.PA.panel.cssVar;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function mount({ container, controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;

    const state = {
      m: [2, 6],
      x: [2.5, 7.5],
      v: [0, 0],
      mode: "idle", // idle | external | internal
      t: 0,
      startX: [2.5, 7.5],
    };

    // ---- canvas ----
    const stage = document.createElement("div");
    stage.className = "com__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 200;
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    const readout = document.createElement("p");
    readout.className = "com__readout";
    stage.appendChild(readout);

    // ---- mass sliders ----
    const grid = document.createElement("div");
    grid.className = "com__grid";
    controls.appendChild(grid);
    const massInputs = [];
    ["Mass 1", "Mass 2"].forEach((label, i) => {
      const row = document.createElement("div");
      row.className = "com__row";
      const name = document.createElement("label");
      name.className = "com__name";
      name.textContent = label;
      const input = document.createElement("input");
      input.type = "range";
      input.min = "1";
      input.max = "10";
      input.step = "1";
      input.value = String(state.m[i]);
      input.id = `com-mass-${i + 1}`;
      input.setAttribute("aria-label", `${label} in kilograms`);
      name.setAttribute("for", input.id);
      const out = document.createElement("span");
      out.className = "com__val";
      out.textContent = `${state.m[i]} kg`;
      input.addEventListener("input", () => {
        state.m[i] = Number(input.value);
        out.textContent = `${state.m[i]} kg`;
        if (state.mode === "idle") draw();
      });
      row.append(name, input, out);
      grid.appendChild(row);
      massInputs.push({ input, out });
    });

    // ---- experiment buttons ----
    const btnRow = document.createElement("div");
    btnRow.className = "com__buttons";
    const extBtn = button("External push →", () => run("external"));
    const intBtn = button("Internal explosion 💥", () => run("internal"));
    const resetBtn = button("Reset", reset);
    btnRow.append(extBtn, intBtn, resetBtn);
    (promptEl || controls).appendChild(btnRow);

    const note = document.createElement("p");
    note.className = "com__note";
    note.hidden = true;
    (promptEl || controls).appendChild(note);

    function button(text, onClick) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "com__btn";
      b.textContent = text;
      b.addEventListener("click", onClick);
      return b;
    }

    // ---- geometry helpers ----
    const trackY = () => canvas.height / 2 + 8;
    const toPx = (x) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (canvas.width - 2 * PAD);
    const toX = (px) => X_MIN + ((px - PAD) / (canvas.width - 2 * PAD)) * (X_MAX - X_MIN);
    const radius = (m) => 7 + Math.sqrt(m) * 3.2;
    const comX = () => (state.m[0] * state.x[0] + state.m[1] * state.x[1]) / (state.m[0] + state.m[1]);

    // ---- dragging (idle only) ----
    let dragging = -1;
    const pointerX = (e) => {
      const r = canvas.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * canvas.width;
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (state.mode !== "idle") return;
      const px = pointerX(e);
      for (let i = 0; i < 2; i++) {
        if (Math.abs(px - toPx(state.x[i])) <= radius(state.m[i]) + 6) {
          dragging = i;
          canvas.setPointerCapture(e.pointerId);
          break;
        }
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (dragging < 0) return;
      state.x[dragging] = clamp(toX(pointerX(e)), X_MIN + 0.3, X_MAX - 0.3);
      draw();
    });
    const endDrag = () => (dragging = -1);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    // ---- experiments ----
    function run(mode) {
      if (state.mode !== "idle") return;
      state.mode = mode;
      state.t = 0;
      state.startX = [state.x[0], state.x[1]];
      const M = state.m[0] + state.m[1];
      if (mode === "internal") {
        // equal and opposite impulses -> v inversely proportional to mass;
        // COM velocity = 0 exactly.
        const J = 9;
        state.v = [-J / state.m[0], J / state.m[1]];
        note.hidden = false;
        note.innerHTML =
          "<strong>Internal.</strong> The masses push on <em>each other</em> — an equal-and-opposite pair. They fly apart, but the ★ center of mass does not move at all.";
      } else {
        // constant external force on mass 1 during the push phase
        state.v = [0, 0];
        state.pushF = 3.5;
        note.hidden = false;
        note.innerHTML =
          "<strong>External.</strong> A force from outside pushes the left mass. The net external force is non-zero, so the ★ center of mass accelerates — though less than the pushed mass, since it carries the total mass " +
          M +
          " kg.";
      }
      extBtn.disabled = intBtn.disabled = true;
      massInputs.forEach((mi) => (mi.input.disabled = true));
      last = performance.now();
      requestAnimationFrame(step);
    }

    let last = 0;
    function step(now) {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      state.t += dt;

      if (state.mode === "external") {
        const pushing = state.t < 0.9;
        const a0 = pushing ? state.pushF / state.m[0] : 0;
        state.v[0] += a0 * dt;
        state.x[0] += state.v[0] * dt;
        state.x[1] += state.v[1] * dt;
      } else if (state.mode === "internal") {
        state.x[0] += state.v[0] * dt;
        state.x[1] += state.v[1] * dt;
      }

      // stop at the track edges, if the masses would collide, or after 2.6 s
      const collide = state.x[0] > state.x[1] - 0.6;
      const hitEdge = collide || state.x.some((x) => x <= X_MIN + 0.3 || x >= X_MAX - 0.3);
      if (collide) state.x[0] = state.x[1] - 0.6;
      if (hitEdge) {
        state.x[0] = clamp(state.x[0], X_MIN + 0.3, X_MAX - 0.3);
        state.x[1] = clamp(state.x[1], X_MIN + 0.3, X_MAX - 0.3);
        state.v = [0, 0];
      }
      draw();
      if (!hitEdge && state.t < 2.6) requestAnimationFrame(step);
      else {
        state.mode = "done";
        // an experiment moves the masses; press Reset to run another
        note.innerHTML += ' <em>Press Reset to try the other one.</em>';
      }
    }

    function reset() {
      state.m = [2, 6];
      state.x = [2.5, 7.5];
      state.v = [0, 0];
      state.mode = "idle";
      state.t = 0;
      massInputs.forEach((mi, i) => {
        mi.input.value = String(state.m[i]);
        mi.input.disabled = false;
        mi.out.textContent = `${state.m[i]} kg`;
      });
      extBtn.disabled = intBtn.disabled = false;
      note.hidden = true;
      draw();
    }

    // ---- draw ----
    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cssVar("--sim-graph-bg", "#16213e");
      ctx.fillRect(0, 0, w, h);

      const y = trackY();
      // track
      ctx.strokeStyle = "#3a4a6c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD - 6, y);
      ctx.lineTo(w - PAD + 6, y);
      ctx.stroke();
      // ticks
      ctx.fillStyle = "#6b7787";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (let m = 0; m <= X_MAX; m += 2) {
        const px = toPx(m);
        ctx.strokeStyle = "#3a4a6c";
        ctx.beginPath();
        ctx.moveTo(px, y - 4);
        ctx.lineTo(px, y + 4);
        ctx.stroke();
        ctx.fillText(String(m), px, y + 18);
      }

      // start-of-run COM guide (external) or fixed COM line (internal)
      const cm = comX();
      if (state.mode === "internal" || state.mode === "done") {
        const cm0 =
          (state.m[0] * state.startX[0] + state.m[1] * state.startX[1]) /
          (state.m[0] + state.m[1]);
        if (state.mode === "internal") {
          ctx.strokeStyle = "rgba(240,194,122,0.35)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(toPx(cm0), y - 60);
          ctx.lineTo(toPx(cm0), y + 30);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // masses — circle sized by mass, tagged "1"/"2", with its kg value above
      [0, 1].forEach((i) => {
        const px = toPx(state.x[i]);
        const r = radius(state.m[i]);
        const cyM = y - r + 2;
        ctx.fillStyle = "#58a6ff";
        ctx.beginPath();
        ctx.arc(px, cyM, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0d1117";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), px, cyM);
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
        ctx.font = "600 11px system-ui, sans-serif";
        ctx.fillText(`${state.m[i]} kg`, px, y - 2 * r - 6);
      });

      // ★ center of mass
      const cpx = toPx(cm);
      ctx.fillStyle = cssVar("--sim-amber", "#f0c27a");
      star(ctx, cpx, y + 2, 8);
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText("★ center of mass", cpx, y + 40);

      readout.textContent =
        `mass 1: ${state.m[0]} kg at ${state.x[0].toFixed(1)} m   ·   ` +
        `mass 2: ${state.m[1]} kg at ${state.x[1].toFixed(1)} m   ·   ` +
        `★ center of mass: ${cm.toFixed(2)} m`;
    }

    function star(c, cx, cy, R) {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 ? R * 0.45 : R;
        const px = cx + rad * Math.cos(ang);
        const py = cy + rad * Math.sin(ang);
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
      c.fill();
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p>The ★ marker is the <strong>mass-weighted average position</strong>: it always sits between the two masses and closer to the heavier one. An <strong>external</strong> push moves it; an <strong>internal</strong> shove between the masses never does.</p>";
    }

    return draw;
  }

  window.PA.panel.register("center-of-mass-explorer", mount);
})();
