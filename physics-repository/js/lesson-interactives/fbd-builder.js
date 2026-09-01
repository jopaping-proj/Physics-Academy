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
    { key: "gravity", label: "Gravity", tex: "\\vec{F}_g", color: "--sim-text", field: true, anchor: "centre", lane: 0 },
    { key: "normal", label: "Normal force", tex: "\\vec{F}_N", color: "--sim-teal", anchor: "back", lane: 9 },
    { key: "tension", label: "Tension", tex: "\\vec{F}_T", color: "--sim-amber", anchor: "toward", lane: 0 },
    { key: "friction", label: "Friction", tex: "\\vec{f}", color: "--sim-red", anchor: "floor", lane: 0 },
    { key: "applied", label: "Applied push / pull", tex: "\\vec{F}_\\text{app}", color: "--sim-amber", anchor: "back", lane: 9 },
    { key: "spring", label: "Spring force", tex: "\\vec{F}_s", color: "--sim-green", anchor: "toward", lane: 0 },
    { key: "drag", label: "Air resistance", tex: "\\vec{F}_\\text{air}", color: "--sim-violet", anchor: "back", lane: -9 },
  ];

  const S = 0.7071;
  const DIRS = {
    up: { dx: 0, dy: -1, glyph: "↑" },
    down: { dx: 0, dy: 1, glyph: "↓" },
    left: { dx: -1, dy: 0, glyph: "←" },
    right: { dx: 1, dy: 0, glyph: "→" },
    "up-right": { dx: S, dy: -S, glyph: "↗" },
    "up-left": { dx: -S, dy: -S, glyph: "↖" },
    "down-right": { dx: S, dy: S, glyph: "↘" },
    "down-left": { dx: -S, dy: S, glyph: "↙" },
  };
  const DIR_ORDER = ["up", "down", "left", "right", "up-right", "up-left", "down-right", "down-left"];

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
    {
      text: "A skydiver falling straight down at constant (terminal) speed.",
      forces: { gravity: "down", drag: "up" },
      magnitude: [["drag", "=", "gravity"]],
      mag: { gravity: 3, drag: 3 },
      hint: "Terminal speed ⇒ constant velocity ⇒ air resistance up exactly balances gravity down.",
    },
    {
      text: "A coffee filter dropped from rest — still speeding up, not yet at terminal speed.",
      forces: { gravity: "down", drag: "up" },
      magnitude: [["gravity", ">", "drag"]],
      mag: { gravity: 4, drag: 2 },
      hint: "Still speeding up ⇒ the net force is downward, so gravity beats the (growing) air resistance.",
    },
    {
      text: "A ball thrown straight up — still on the way up, with noticeable air resistance.",
      forces: { gravity: "down", drag: "down" },
      magnitude: [],
      mag: { gravity: 3, drag: 2 },
      hint: "Air resistance opposes the motion. The ball moves up, so drag points DOWN — the same way as gravity, so the ball slows faster than in free fall.",
    },
    {
      text: "A car cruising on a level highway at a constant 100 km/h.",
      forces: { gravity: "down", normal: "up", applied: "right", drag: "left" },
      magnitude: [["normal", "=", "gravity"], ["applied", "=", "drag"]],
      mag: { gravity: 3, normal: 3, applied: 3, drag: 3 },
      hint: "Constant speed ⇒ the forward drive force exactly balances air resistance backward; the road's normal force balances gravity.",
    },
    {
      text: "A box sliding across a rough floor, slowing to a stop — nobody is pushing it.",
      forces: { gravity: "down", normal: "up", friction: "left" },
      magnitude: [["normal", "=", "gravity"]],
      mag: { gravity: 3, normal: 3, friction: 3 },
      hint: "No push now — friction is the only horizontal force, so the net force points backward and the box decelerates. It keeps moving only by inertia. (Motion is to the right, friction points left.)",
    },
    {
      text: "A block on a vertical spring, at rest — the spring is compressed.",
      forces: { gravity: "down", spring: "up" },
      magnitude: [["spring", "=", "gravity"]],
      mag: { gravity: 3, spring: 3 },
      hint: "At rest ⇒ the compressed spring pushes up with exactly the block's weight.",
    },
    {
      text: "A block on a rough table, tied to a wall by a stretched spring, dragged away by a rope at constant speed.",
      forces: { gravity: "down", normal: "up", tension: "right", spring: "left", friction: "left" },
      magnitude: [["normal", "=", "gravity"], ["tension", ">", "spring"], ["tension", ">", "friction"]],
      mag: { gravity: 3, normal: 3, tension: 5, spring: 3, friction: 2 },
      hint: "Constant speed ⇒ the rope's forward pull balances the spring's backward pull PLUS friction. Vertically, the normal force balances gravity.",
    },
    {
      text: "A block sliding down a frictionless 45° ramp, speeding up.",
      incline: 45,
      forces: { gravity: "down", normal: "up-left" },
      magnitude: [["gravity", ">", "normal"]],
      mag: { gravity: 4, normal: 3 },
      hint: "Two forces only: gravity straight DOWN (the full weight) and the normal force PERPENDICULAR to the ramp — for a 45° ramp that is exactly the up-left ↖ direction. The normal force is smaller than the weight.",
    },
    {
      text: "A block sliding down a rough 45° ramp at constant velocity.",
      incline: 45,
      forces: { gravity: "down", normal: "up-left", friction: "up-right" },
      magnitude: [["gravity", ">", "normal"]],
      mag: { gravity: 4, normal: 3, friction: 3 },
      hint: "Sliding DOWN a 45° ramp ⇒ friction points UP the ramp, exactly the up-right ↗ direction. Constant velocity ⇒ the normal force ↖ and friction ↗ together balance gravity ↓.",
    },
  ];

  const cssVar = window.PA.panel.cssVar;

  // Where a ray from the box centre, in direction (ux, uy), crosses the
  // box edge — so a contact force's tail sits ON the surface it acts on,
  // even for a diagonal rope or push (master §11). Returns an offset
  // from the centre.
  function edgeOffset(hw, hh, ux, uy) {
    if (!ux && !uy) return [0, 0];
    const tX = ux ? hw / Math.abs(ux) : Infinity;
    const tY = uy ? hh / Math.abs(uy) : Infinity;
    const t = Math.min(tX, tY);
    return [ux * t, uy * t];
  }

  // tail dot included, so a force's starting point (the surface it acts
  // on) is unmistakable.
  function drawArrow(ctx, x1, y1, x2, y2, color) {
    window.PA.panel.arrow(ctx, x1, y1, x2, y2, color, { width: 3, head: 10, tailDot: true });
  }

  function mount({ container, controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;

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
      // on a ramp the box tilts and gravity runs the full height of the
      // canvas — start a little higher so its label still fits.
      const cy = canvas.height / 2 + (state.scenario.incline ? -14 : 4);
      const hw = 38; // half width
      const hh = 24; // half height
      const incDeg = state.scenario.incline || 0;
      const inc = (-incDeg * Math.PI) / 180; // ramp rises to the right

      // ground / ramp line — drawn in the box's own (rotated) frame at its
      // bottom face, so the box always sits exactly on the surface and a
      // contact force's tail lands on that same line.
      if (incDeg || state.on.normal || state.on.friction) {
        ctx.strokeStyle = "#3a4a6c";
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(inc);
        ctx.beginPath();
        ctx.moveTo(-(cx - 24), hh);
        ctx.lineTo(cx - 24, hh);
        ctx.stroke();
        // hatching
        for (let x = -(cx - 30); x < cx - 30; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, hh);
          ctx.lineTo(x - 7, hh + 9);
          ctx.stroke();
        }
        ctx.restore();
      }

      // the box (tilted to sit on the ramp)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(inc);
      ctx.strokeStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.fillStyle = "rgba(230,237,243,0.05)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-hw, -hh, hw * 2, hh * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
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
        if (f.anchor === "centre") {
          // gravity — the one field force, from the centre
        } else if (incDeg) {
          // on a ramp, every contact force acts at the box's ramp-facing
          // (bottom) face — rotated with the box.
          tx = cx - hh * Math.sin(inc);
          ty = cy + hh * Math.cos(inc);
        } else if (f.anchor === "floor") {
          // friction acts along the resting (bottom) surface
          ty = cy + hh;
        } else if (f.anchor === "back") {
          // the surface opposite the force direction (you push on the back face)
          const [ox, oy] = edgeOffset(hw, hh, -d.dx, -d.dy);
          tx = cx + ox;
          ty = cy + oy;
        } else if (f.anchor === "toward") {
          // a rope / spring attaches on the face it pulls toward
          const [ox, oy] = edgeOffset(hw, hh, d.dx, d.dy);
          tx = cx + ox;
          ty = cy + oy;
        }

        // fixed lateral shift along the arrow's left-perpendicular, so an
        // up arrow and a down arrow (or two parallel arrows) never overlap.
        // On a ramp the forces already point in distinct directions, so the
        // nudge would only pull a tail off the surface — skip it there.
        if (!incDeg) {
          const px = -d.dy;
          const py = d.dx;
          tx += px * f.lane;
          ty += py * f.lane;
        }

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

      // ramp indicator beneath the dot, for incline scenarios
      if (state.scenario.incline) {
        ctx.strokeStyle = "#3a4a6c";
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(cx, cy + 26);
        ctx.rotate((-state.scenario.incline * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(-70, 0);
        ctx.lineTo(70, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = cssVar("--sim-text", "#e0e0e0");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const sx = canvas.clientWidth ? canvas.clientWidth / canvas.width : 1;
      const sy = canvas.clientHeight ? canvas.clientHeight / canvas.height : 1;

      const active = FORCES.filter((f) => state.on[f.key]);
      active.forEach((f) => {
        const d = DIRS[state.dir[f.key]];
        // only nudge the tail sideways if another force shares this axis
        // (same or opposite direction); a lone force runs along the axis.
        const shared = active.some((g) => {
          if (g.key === f.key) return false;
          const e = DIRS[state.dir[g.key]];
          return Math.abs(d.dx * e.dx + d.dy * e.dy) > 0.9;
        });
        const px = -d.dy;
        const py = d.dx;
        const off = shared ? f.lane * 0.7 : 0;
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

    loadScenario(0);
    return redraw;
  }

  window.PA.panel.register("fbd-builder", mount);
})();
