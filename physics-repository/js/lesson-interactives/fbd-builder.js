/**
 * FBD Builder for the "Forces and Free-Body Diagrams" lesson
 * (master-project-prompt.md §14; C2.2 / CED topic 2.2). Self-mounts on
 * DOMContentLoaded into the `[data-component-key="fbd-builder"]` section
 * build/render/sections.js emits.
 *
 * The student picks a scenario, turns on the forces they think act on
 * the object, and sets each one's direction; a Canvas redraws the
 * diagram live. "Check" compares their diagram to the scenario's answer
 * key and reports what's missing, extra, or mis-directed — never just
 * "wrong" (rigor-standard-addendum.md §8 / master §31).
 *
 * Plain script, not an ES module (see js/content-loader.js) — wrapped
 * in an IIFE. No external library; everything is Canvas 2D.
 */
(function () {
  const FORCES = [
    { key: "gravity", label: "Gravity", sym: "F_g", color: "--sim-text" },
    { key: "normal", label: "Normal force", sym: "F_N", color: "--sim-teal" },
    { key: "tension", label: "Tension", sym: "F_T", color: "--sim-amber" },
    { key: "friction", label: "Friction", sym: "f", color: "--sim-red" },
    { key: "applied", label: "Applied push / pull", sym: "F_app", color: "--sim-amber" },
    { key: "spring", label: "Spring force", sym: "F_s", color: "--sim-green" },
  ];

  const DIRS = {
    up: { dx: 0, dy: -1, glyph: "↑" },
    down: { dx: 0, dy: 1, glyph: "↓" },
    left: { dx: -1, dy: 0, glyph: "←" },
    right: { dx: 1, dy: 0, glyph: "→" },
    "up-right": { dx: 0.71, dy: -0.71, glyph: "↗" },
    "up-left": { dx: -0.71, dy: -0.71, glyph: "↖" },
  };
  const DIR_ORDER = ["up", "down", "left", "right", "up-right", "up-left"];

  const SCENARIOS = [
    {
      id: "book",
      text: "A book resting on a level table.",
      answer: { gravity: "down", normal: "up" },
    },
    {
      id: "crate",
      text: "A crate pushed to the right across a rough floor — and speeding up.",
      answer: { gravity: "down", normal: "up", applied: "right", friction: "left" },
    },
    {
      id: "ball",
      text: "A ball hanging at rest from a single vertical string.",
      answer: { gravity: "down", tension: "up" },
    },
  ];

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, label) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - Math.PI / 6), y2 - h * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - h * Math.cos(a + Math.PI / 6), y2 - h * Math.sin(a + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(label, x2 + 6 * Math.sign(x2 - x1 || 1) - (x2 < x1 ? 22 : 0), y2 + (y2 < y1 ? -6 : 14));
    }
  }

  function mount(container) {
    const controls = container.querySelector(".interactive-panel__controls");
    const canvasWrap = container.querySelector(".interactive-panel__canvas-wrap");
    const promptEl = container.querySelector(".sim-prompt");
    const insightEl = container.querySelector(".sim-insight");
    if (!controls || !canvasWrap) return;

    // state: which forces are on, and each one's direction
    const state = { scenario: SCENARIOS[0], on: {}, dir: {} };
    FORCES.forEach((f) => {
      state.on[f.key] = false;
      state.dir[f.key] = "down";
    });

    // ---- scenario selector ----
    const scenRow = document.createElement("div");
    scenRow.className = "fbd__scenario";
    const scenLabel = document.createElement("label");
    scenLabel.textContent = "Scenario:";
    scenLabel.setAttribute("for", "fbd-scenario");
    const scenSelect = document.createElement("select");
    scenSelect.id = "fbd-scenario";
    SCENARIOS.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.text;
      scenSelect.appendChild(opt);
    });
    scenRow.appendChild(scenLabel);
    scenRow.appendChild(scenSelect);
    controls.appendChild(scenRow);

    // ---- one row per force ----
    const grid = document.createElement("div");
    grid.className = "fbd__grid";
    controls.appendChild(grid);

    FORCES.forEach((f) => {
      const row = document.createElement("div");
      row.className = "fbd__row";

      const toggle = document.createElement("label");
      toggle.className = "fbd__toggle";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.addEventListener("change", () => {
        state.on[f.key] = cb.checked;
        row.dataset.on = String(cb.checked);
        redraw();
      });
      toggle.appendChild(cb);
      toggle.appendChild(document.createTextNode(` ${f.label}`));
      row.appendChild(toggle);

      const dirs = document.createElement("div");
      dirs.className = "fbd__dirs";
      DIR_ORDER.forEach((d) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "fbd__dir";
        b.textContent = DIRS[d].glyph;
        b.title = d.replace("-", " ");
        b.dataset.active = d === state.dir[f.key] ? "true" : "false";
        b.addEventListener("click", () => {
          state.dir[f.key] = d;
          dirs.querySelectorAll(".fbd__dir").forEach((x) => (x.dataset.active = "false"));
          b.dataset.active = "true";
          if (!state.on[f.key]) {
            state.on[f.key] = true;
            cb.checked = true;
            row.dataset.on = "true";
          }
          redraw();
        });
        dirs.appendChild(b);
      });
      row.appendChild(dirs);
      grid.appendChild(row);
    });

    // ---- canvas ----
    const canvas = document.createElement("canvas");
    canvas.width = 460;
    canvas.height = 300;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    canvasWrap.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function redraw() {
      const bg = cssVar("--sim-graph-bg", "#16213e");
      const boxColor = cssVar("--sim-text", "#e0e0e0");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // the object
      ctx.strokeStyle = boxColor;
      ctx.fillStyle = "rgba(230,237,243,0.06)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - 26, cy - 18, 52, 36);
      ctx.fill();
      ctx.stroke();

      const L = 78;
      FORCES.forEach((f) => {
        if (!state.on[f.key]) return;
        const d = DIRS[state.dir[f.key]];
        drawArrow(ctx, cx, cy, cx + d.dx * L, cy + d.dy * L, cssVar(f.color, "#e0e0e0"), f.sym);
      });

      const anyOn = FORCES.some((f) => state.on[f.key]);
      if (!anyOn) {
        ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText("Turn on the forces that act on the object.", 20, 24);
      }
    }

    // ---- check ----
    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "fbd__check";
    checkBtn.textContent = "Check my diagram";
    const feedback = document.createElement("div");
    feedback.className = "fbd__feedback";
    feedback.hidden = true;
    promptEl.appendChild(checkBtn);
    promptEl.appendChild(feedback);

    checkBtn.addEventListener("click", () => {
      const ans = state.scenario.answer;
      const chosen = {};
      FORCES.forEach((f) => {
        if (state.on[f.key]) chosen[f.key] = state.dir[f.key];
      });

      const missing = [];
      const wrongDir = [];
      const extra = [];
      for (const k of Object.keys(ans)) {
        if (!(k in chosen)) missing.push(k);
        else if (chosen[k] !== ans[k]) wrongDir.push(k);
      }
      for (const k of Object.keys(chosen)) {
        if (!(k in ans)) extra.push(k);
      }

      const name = (k) => FORCES.find((f) => f.key === k).label.toLowerCase();
      const lines = [];
      if (!missing.length && !wrongDir.length && !extra.length) {
        lines.push("✅ <strong>Correct.</strong> Every force that acts is shown, pointing the right way, and nothing extra is on the diagram.");
      } else {
        lines.push("<strong>Not quite — here's what to fix:</strong>");
        if (missing.length)
          lines.push(`• <strong>Missing:</strong> ${missing.map(name).join(", ")}. Something is exerting this force on the object — what is touching it, or is it gravity?`);
        if (wrongDir.length)
          lines.push(`• <strong>Wrong direction:</strong> ${wrongDir.map(name).join(", ")}. Re-check which way this force pushes or pulls.`);
        if (extra.length)
          lines.push(`• <strong>Doesn't belong:</strong> ${extra.map(name).join(", ")}. Name the object exerting it on this object — if you can't, it's not a real force here (no "force of motion").`);
      }
      feedback.hidden = false;
      feedback.innerHTML = lines.join("<br>");
    });

    // ---- scenario change ----
    function loadScenario(i) {
      state.scenario = SCENARIOS[i];
      FORCES.forEach((f) => {
        state.on[f.key] = false;
      });
      grid.querySelectorAll(".fbd__row").forEach((row) => {
        row.dataset.on = "false";
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      });
      feedback.hidden = true;
      if (insightEl) {
        insightEl.innerHTML =
          "<p>Ask: <strong>what is touching the object?</strong> Each contact is a normal force, maybe a friction force, or a tension. Then add gravity. Draw only the forces <em>on</em> the object.</p>";
      }
      redraw();
    }
    scenSelect.addEventListener("change", () => loadScenario(Number(scenSelect.value)));

    const slide = container.closest(".slide");
    if (slide) slide.addEventListener("slide:shown", redraw);

    loadScenario(0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector('[data-component-key="fbd-builder"]');
    if (container) mount(container);
  });
})();
