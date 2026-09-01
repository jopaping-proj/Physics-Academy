/**
 * FBD Builder for the "Forces and Free-Body Diagrams" lesson
 * (C2.2 / CED topic 2.2). Self-mounts on DOMContentLoaded into the
 * `[data-component-key="fbd-builder"]` section.
 *
 * The student picks a scenario, then for each force sets: present?,
 * direction, and a RELATIVE magnitude (1–5). Two diagrams update live:
 *
 *   - BOX diagram — a contact force's arrow starts at the surface it
 *     acts on; the field force (gravity) starts at the box's centre.
 *   - DOT diagram — every arrow starts at the edge of the dot.
 *
 * Parallel / antiparallel arrows are nudged perpendicular so their
 * tails and their presence stay visible. Labels are real LaTeX,
 * rendered with KaTeX into positioned overlays.
 *
 * "Check" compares the diagram to the scenario's answer key — forces
 * present, directions, AND magnitude relationships (e.g. "the push must
 * exceed friction", "F_N < F_g when a rope pulls partly up") — and
 * reports what to fix, never just "wrong" (rigor §8 / master §31).
 *
 * Plain script, IIFE, Canvas 2D + KaTeX. See js/content-loader.js for
 * why this is not an ES module.
 */
(function () {
  // anchor: where the arrow's TAIL sits on the box (master §11).
  //   "centre"  — field force, from the centre dot (gravity only)
  //   "back"    — contact face opposite the force direction (a push)
  //   "toward"  — contact face on the side the force points (a rope/spring)
  //   "floor"   — the resting surface, i.e. the box's bottom edge (friction)
  // lane: fixed lateral shift (px) so parallel/opposing arrows never coincide.
  const FORCES = [
    { key: "gravity", label: "Gravity", tex: "\\vec{F}_g", color: "--sim-text", field: true, anchor: "centre", lane: 9 },
    { key: "normal", label: "Normal force", tex: "\\vec{F}_N", color: "--sim-teal", anchor: "back", lane: 9 },
    { key: "tension", label: "Tension", tex: "\\vec{F}_T", color: "--sim-amber", anchor: "toward", lane: 0 },
    { key: "friction", label: "Friction", tex: "\\vec{f}", color: "--sim-red", anchor: "floor", lane: 0 },
    { key: "applied", label: "Applied push / pull", tex: "\\vec{F}_\\text{app}", color: "--sim-amber", anchor: "back", lane: 9 },
    { key: "spring", label: "Spring force", tex: "\\vec{F}_s", color: "--sim-green", anchor: "toward", lane: 0 },
  ];

  const DIRS = {
    up: { dx: 0, dy: -1, glyph: "↑" },
    down: { dx: 0, dy: 1, glyph: "↓" },
    left: { dx: -1, dy: 0, glyph: "←" },
    right: { dx: 1, dy: 0, glyph: "→" },
    "up-right": { dx: 0.7, dy: -0.7, glyph: "↗" },
    "up-left": { dx: -0.7, dy: -0.7, glyph: "↖" },
  };
  const DIR_ORDER = ["up", "down", "left", "right", "up-right", "up-left"];

  // magnitude relationships to check: [a, op, b], op in "=" "<" ">"
  const SCENARIOS = [
    {
      text: "A book resting on a level table.",
      forces: { gravity: "down", normal: "up" },
      magnitude: [["normal", "=", "gravity"]],
      mag: { gravity: 3, normal: 3 },
      hint: "At rest ⇒ the up force and the down force are equal.",
    },
    {
      text: "A ball hanging at rest from a single vertical string.",
      forces: { gravity: "down", tension: "up" },
      magnitude: [["tension", "=", "gravity"]],
      mag: { gravity: 3, tension: 3 },
      hint: "At rest ⇒ the string's tension balances gravity exactly.",
    },
    {
      text: "A crate pushed to the right across a rough floor — and speeding up.",
      forces: { gravity: "down", normal: "up", applied: "right", friction: "left" },
      magnitude: [["normal", "=", "gravity"], ["applied", ">", "friction"]],
      mag: { gravity: 3, normal: 3, applied: 4, friction: 2 },
      hint: "Speeding up ⇒ the push beats friction. Vertically the forces still balance.",
    },
    {
      text: "A crate dragged at constant speed by a rope pulling up-and-to-the-right.",
      forces: { gravity: "down", normal: "up", tension: "up-right", friction: "left" },
      magnitude: [["normal", "<", "gravity"]],
      mag: { gravity: 4, normal: 2, tension: 4, friction: 3 },
      hint: "The rope pulls partly up, so the floor supports less than the full weight: F_N < F_g.",
    },
  ];

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - Math.PI / 6), y2 - h * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - h * Math.cos(a + Math.PI / 6), y2 - h * Math.sin(a + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    // tail dot, so the starting point is unmistakable
    ctx.beginPath();
    ctx.arc(x1, y1, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function mount(container) {
    const controls = container.querySelector(".interactive-panel__controls");
    const canvasWrap = container.querySelector(".interactive-panel__canvas-wrap");
    const promptEl = container.querySelector(".sim-prompt");
    const insightEl = container.querySelector(".sim-insight");
    if (!controls || !canvasWrap) return;

    const state = { scenario: SCENARIOS[0], on: {}, dir: {}, mag: {} };
    FORCES.forEach((f) => {
      state.on[f.key] = false;
      state.dir[f.key] = "down";
      state.mag[f.key] = 3;
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
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = s.text;
      scenSelect.appendChild(o);
    });
    scenRow.append(scenLabel, scenSelect);
    controls.appendChild(scenRow);

    // ---- one row per force ----
    const grid = document.createElement("div");
    grid.className = "fbd__grid";
    controls.appendChild(grid);

    FORCES.forEach((f) => {
      const row = document.createElement("div");
      row.className = "fbd__row";
      row.dataset.on = "false";

      const toggle = document.createElement("label");
      toggle.className = "fbd__toggle";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.addEventListener("change", () => {
        state.on[f.key] = cb.checked;
        row.dataset.on = String(cb.checked);
        redraw();
      });
      toggle.append(cb, document.createTextNode(` ${f.label}`));

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

      const magWrap = document.createElement("label");
      magWrap.className = "fbd__mag";
      magWrap.append(document.createTextNode("length "));
      const mag = document.createElement("input");
      mag.type = "range";
      mag.min = "1";
      mag.max = "5";
      mag.step = "1";
      mag.value = "3";
      mag.setAttribute("aria-label", `${f.label} relative length`);
      mag.addEventListener("input", () => {
        state.mag[f.key] = Number(mag.value);
        redraw();
      });
      magWrap.appendChild(mag);

      row.append(toggle, dirs, magWrap);
      grid.appendChild(row);
    });

    // ---- two diagram panels (canvas + KaTeX label overlay) ----
    const diagrams = document.createElement("div");
    diagrams.className = "fbd__diagrams";
    canvasWrap.replaceWith(diagrams); // the plain canvas-wrap isn't the layout we want

    function makePanel(title) {
      const panel = document.createElement("div");
      panel.className = "fbd__panel";
      const h = document.createElement("p");
      h.className = "fbd__panel-title";
      h.textContent = title;
      const stage = document.createElement("div");
      stage.className = "fbd__stage";
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 260;
      const overlay = document.createElement("div");
      overlay.className = "fbd__labels";
      stage.append(canvas, overlay);
      panel.append(h, stage);
      diagrams.appendChild(panel);
      return { canvas, ctx: canvas.getContext("2d"), overlay };
    }
    const box = makePanel("Box diagram");
    const dot = makePanel("Dot diagram");

    // `dir` is the force's unit direction; the label is shifted so it sits
    // fully beyond the arrowhead, never on the arrow (master §11).
    function placeLabel(panel, cx_px, cy_px, tex, color, dir) {
      const span = document.createElement("span");
      span.className = "fbd-label";
      span.style.left = cx_px + "px";
      span.style.top = cy_px + "px";
      span.style.color = color;
      if (dir) {
        const tx = dir.dx > 0.3 ? "0" : dir.dx < -0.3 ? "-100%" : "-50%";
        const ty = dir.dy > 0.3 ? "0" : dir.dy < -0.3 ? "-100%" : "-50%";
        span.style.transform = `translate(${tx}, ${ty})`;
      }
      if (window.katex) {
        try {
          window.katex.render(tex, span, { throwOnError: false });
        } catch (_) {
          span.textContent = tex;
        }
      } else {
        span.textContent = tex.replace(/\\vec\{|\}|\\text\{|_/g, "");
      }
      panel.overlay.appendChild(span);
    }

    function forceLen(f) {
      // wide range so a length-2 arrow reads as clearly shorter than a
      // length-4 arrow — relative lengths are meant to carry meaning.
      return 20 + state.mag[f.key] * 16; // canvas px, mag 1..5 -> 36..100
    }

    /** Box diagram: contact forces from the contact surface, gravity
     * from the centre; a per-force perpendicular nudge keeps parallel
     * arrows from coinciding. */
    function drawBox() {
      const { ctx, canvas } = box;
      const bg = cssVar("--sim-graph-bg", "#16213e");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      box.overlay.innerHTML = "";

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 4;
      const hw = 38; // half width
      const hh = 24; // half height

      // ground line under the box when a resting-surface force is present
      if (state.on.normal || state.on.friction) {
        ctx.strokeStyle = "#3a4a6c";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(24, cy + hh);
        ctx.lineTo(canvas.width - 24, cy + hh);
        ctx.stroke();
      }

      ctx.strokeStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.fillStyle = "rgba(230,237,243,0.05)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      const sx = canvas.clientWidth ? canvas.clientWidth / canvas.width : 1;
      const sy = canvas.clientHeight ? canvas.clientHeight / canvas.height : 1;

      FORCES.forEach((f) => {
        if (!state.on[f.key]) return;
        const d = DIRS[state.dir[f.key]];
        // --- tail anchor on the box (master §11) ---
        let tx = cx;
        let ty = cy;
        if (f.anchor === "back") {
          // the surface opposite the force direction (you push on the back face)
          tx = cx - d.dx * hw;
          ty = cy - d.dy * hh;
        } else if (f.anchor === "toward") {
          // a rope / spring attaches on the side it pulls toward
          tx = cx + d.dx * hw;
          ty = cy + d.dy * hh;
        } else if (f.anchor === "floor") {
          // friction acts along the resting (bottom) surface
          ty = cy + hh;
        } // "centre" (gravity): stays at (cx, cy)

        // fixed lateral shift along the arrow's left-perpendicular, so an
        // up arrow and a down arrow (or two parallel arrows) never overlap.
        const px = -d.dy;
        const py = d.dx;
        tx += px * f.lane;
        ty += py * f.lane;

        const L = forceLen(f);
        const ex = tx + d.dx * L;
        const ey = ty + d.dy * L;
        drawArrow(ctx, tx, ty, ex, ey, cssVar(f.color, "#e0e0e0"));
        placeLabel(box, (ex + d.dx * 14) * sx, (ey + d.dy * 14) * sy, f.tex, cssVar(f.color, "#e0e0e0"), d);
      });

      emptyHint(box, ctx);
    }

    /** Dot diagram: every arrow from the dot edge, spoke-style, with the
     * same anti-coincidence nudge. */
    function drawDot() {
      const { ctx, canvas } = dot;
      const bg = cssVar("--sim-graph-bg", "#16213e");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      dot.overlay.innerHTML = "";

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 4;
      const r = 8; // small dot (~0.5 cm on screen); every arrow starts at its edge
      ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const sx = canvas.clientWidth ? canvas.clientWidth / canvas.width : 1;
      const sy = canvas.clientHeight ? canvas.clientHeight / canvas.height : 1;

      FORCES.forEach((f) => {
        if (!state.on[f.key]) return;
        const d = DIRS[state.dir[f.key]];
        const px = -d.dy;
        const py = d.dx;
        const off = f.lane * 0.7;
        const tx = cx + d.dx * (r + 1) + px * off;
        const ty = cy + d.dy * (r + 1) + py * off;
        const L = forceLen(f);
        const ex = tx + d.dx * L;
        const ey = ty + d.dy * L;
        drawArrow(ctx, tx, ty, ex, ey, cssVar(f.color, "#e0e0e0"));
        placeLabel(dot, (ex + d.dx * 12) * sx, (ey + d.dy * 12) * sy, f.tex, cssVar(f.color, "#e0e0e0"), d);
      });

      emptyHint(dot, ctx);
    }

    function emptyHint(panel, ctx) {
      if (FORCES.some((f) => state.on[f.key])) return;
      ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText("Turn on the forces that act.", 16, 22);
    }

    function redraw() {
      drawBox();
      drawDot();
    }

    // ---- check ----
    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "fbd__check";
    checkBtn.textContent = "Check my diagram";
    const feedback = document.createElement("div");
    feedback.className = "fbd__feedback";
    feedback.hidden = true;
    promptEl.append(checkBtn, feedback);

    const name = (k) => FORCES.find((f) => f.key === k).label.toLowerCase();

    function magOk(a, op, b) {
      const va = state.mag[a];
      const vb = state.mag[b];
      if (op === "=") return Math.abs(va - vb) <= 1;
      if (op === ">") return va > vb;
      if (op === "<") return va < vb;
      return true;
    }

    checkBtn.addEventListener("click", () => {
      const ans = state.scenario.forces;
      const chosen = {};
      FORCES.forEach((f) => {
        if (state.on[f.key]) chosen[f.key] = state.dir[f.key];
      });

      const missing = Object.keys(ans).filter((k) => !(k in chosen));
      const wrongDir = Object.keys(ans).filter((k) => k in chosen && chosen[k] !== ans[k]);
      const extra = Object.keys(chosen).filter((k) => !(k in ans));

      const lines = [];
      const structureOk = !missing.length && !wrongDir.length && !extra.length;

      if (structureOk) {
        const magProblems = (state.scenario.magnitude || []).filter(([a, op, b]) => !magOk(a, op, b));
        if (!magProblems.length) {
          lines.push("✅ <strong>Correct.</strong> The right forces, the right directions, and the relative lengths are consistent with the motion.");
        } else {
          lines.push("The forces and directions are right — now fix the <strong>relative lengths</strong>:");
          magProblems.forEach(([a, op, b]) => {
            const word = op === "=" ? "the same length as" : op === ">" ? "longer than" : "shorter than";
            lines.push(`• ${name(a)} should be <strong>${word}</strong> ${name(b)}. ${state.scenario.hint}`);
          });
        }
      } else {
        lines.push("<strong>Not quite — here's what to fix:</strong>");
        if (missing.length)
          lines.push(`• <strong>Missing:</strong> ${missing.map(name).join(", ")}. Something exerts this on the object — is it a surface, a rope, or gravity?`);
        if (wrongDir.length)
          lines.push(`• <strong>Wrong direction:</strong> ${wrongDir.map(name).join(", ")}. Re-check which way it pushes or pulls.`);
        if (extra.length)
          lines.push(`• <strong>Doesn't belong:</strong> ${extra.map(name).join(", ")}. Name the object exerting it — if you can't, it's not a real force (no "force of motion").`);
      }
      feedback.hidden = false;
      feedback.innerHTML = lines.join("<br>");
    });

    // ---- scenario change / reset ----
    function loadScenario(i) {
      state.scenario = SCENARIOS[i];
      const seed = state.scenario.mag || {};
      FORCES.forEach((f) => {
        state.on[f.key] = false;
        state.mag[f.key] = seed[f.key] || 3;
      });
      grid.querySelectorAll(".fbd__row").forEach((row, idx) => {
        row.dataset.on = "false";
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
        const mag = row.querySelector('input[type="range"]');
        if (mag) mag.value = String(state.mag[FORCES[idx].key]);
      });
      feedback.hidden = true;
      if (insightEl) {
        insightEl.innerHTML =
          "<p>Ask <strong>what is touching the object</strong> — each contact is a normal force, maybe friction, or a tension — then add gravity. In the <em>box</em> diagram a contact arrow starts <strong>at the surface it acts on</strong>; only gravity starts at the centre. In the <em>dot</em> diagram every arrow starts at the edge of the dot.</p><p><strong>Arrow length shows relative strength.</strong> Two arrows the same length mean those forces balance (no acceleration that way); if the object speeds up in some direction, the arrow that way must be visibly longer. Estimates are fine — get the <em>ordering</em> right.</p>";
      }
      redraw();
    }
    scenSelect.addEventListener("change", () => loadScenario(Number(scenSelect.value)));

    const slide = container.closest(".slide");
    if (slide) slide.addEventListener("slide:shown", redraw);
    window.addEventListener("resize", redraw);

    loadScenario(0);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector('[data-component-key="fbd-builder"]');
    if (container) mount(container);
  });
})();
