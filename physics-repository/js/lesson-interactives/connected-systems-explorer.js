/**
 * Connected-Systems Explorer for the "Connected Objects and Systems"
 * lesson (C2.7 / CED topic 2.5). Registered through window.PA.panel.
 *
 * A block m1 on a frictionless table, a rope over an ideal pulley, a
 * hanging block m2. Set the two masses and read the same situation
 * solved two ways:
 *   - SYSTEM: both blocks, total mass m1+m2, the only external force
 *     along the motion is m2 g  ->  a = m2 g / (m1 + m2)
 *   - INDIVIDUAL: the table block alone gives F_T = m1 a; the hanging
 *     block alone gives F_T = m2 (g - a) — same number (reconciled).
 * The payoff: F_T is always LESS than the hanging weight m2 g (equal
 * only when a = 0), because part of that weight goes into accelerating
 * m2 downward.
 *
 * Plain <script>, not an ES module (see js/content-loader.js).
 */
(function () {
  const { cssVar, arrow, register } = window.PA.panel;
  const G = 9.8;

  function slider(controls, { label, min, max, step, value }) {
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
    input.setAttribute("aria-label", label + " in kilograms");
    const out = document.createElement("span");
    out.className = "fx2__val";
    const show = () => (out.textContent = input.value + " kg");
    show();
    wrap.append(name, input, out);
    controls.appendChild(wrap);
    return { input, show };
  }

  function mount({ controls, canvasWrap, promptEl, insightEl }) {
    if (!canvasWrap) return;
    const state = { m1: 4, m2: 2 };

    const stage = document.createElement("div");
    stage.className = "fx2__stage";
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 272;
    canvas.setAttribute("role", "img");
    stage.appendChild(canvas);
    canvasWrap.replaceWith(stage);
    const ctx = canvas.getContext("2d");

    const s1 = slider(controls, { label: "Table block m₁", min: 1, max: 10, step: 1, value: state.m1 });
    const s2 = slider(controls, { label: "Hanging block m₂", min: 1, max: 10, step: 1, value: state.m2 });
    s1.input.addEventListener("input", () => { state.m1 = +s1.input.value; s1.show(); draw(); });
    s2.input.addEventListener("input", () => { state.m2 = +s2.input.value; s2.show(); draw(); });

    const readout = document.createElement("div");
    readout.className = "ipe__readout";
    (promptEl || controls).appendChild(readout);

    function model() {
      const M = state.m1 + state.m2;
      const ext = state.m2 * G;         // external force along the motion
      const a = ext / M;
      const FT = state.m1 * a;           // from the table block's FBD
      const FTcheck = state.m2 * (G - a); // from the hanging block's FBD
      return { M, ext, a, FT, FTcheck };
    }

    function label(sym, x, y, color, align) {
      const m = /^([A-Za-z]+)_(.+)$/.exec(sym);
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.textAlign = align || "center";
      if (m) {
        ctx.font = "600 13px system-ui, sans-serif";
        const mw = ctx.measureText(m[1]).width;
        let bx = align === "end" ? x - (mw + 5) : align === "center" || !align ? x - (mw + 5) / 2 : x;
        ctx.textAlign = "left";
        ctx.fillText(m[1], bx, y);
        ctx.font = "600 9px system-ui, sans-serif";
        ctx.fillText(m[2], bx + mw + 1, y + 3);
      } else {
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillText(sym, x, y);
      }
      ctx.textAlign = "center";
    }

    function draw() {
      const M = model();
      const ink = cssVar("--sim-text", "#e0e0e0");
      const cN = cssVar("--sim-blue", "#58a6ff");
      const cG = cssVar("--sim-grey", "#8b96a5");
      const cT = cssVar("--sim-amber", "#f0c27a");
      const cH = cssVar("--sim-green", "#51cf66");
      ctx.fillStyle = cssVar("--sim-graph-bg", "#16213e");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // table
      const tableY = 72, tableL = 34, tableR = 286;
      ctx.strokeStyle = "#3a4a6c";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tableL, tableY); ctx.lineTo(tableR, tableY); ctx.stroke();
      ctx.lineWidth = 1;
      for (let x = tableL + 14; x < tableR - 6; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, tableY); ctx.lineTo(x - 7, tableY + 8); ctx.stroke();
      }
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tableL + 16, tableY); ctx.lineTo(tableL + 16, tableY + 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tableR - 16, tableY); ctx.lineTo(tableR - 16, tableY + 120); ctx.stroke();

      // block m1 — width grows a little with mass
      const w1 = 32 + state.m1 * 2.4;
      const bx1 = 116;
      ctx.fillStyle = cN + "22"; ctx.strokeStyle = cN; ctx.lineWidth = 1.6;
      ctx.fillRect(bx1 - w1 / 2, tableY - 26, w1, 26);
      ctx.strokeRect(bx1 - w1 / 2, tableY - 26, w1, 26);
      label("m_1", bx1, tableY - 13, cN);

      // pulley
      const px = tableR, py = tableY - 4, pr = 11;
      ctx.strokeStyle = cG; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();

      // hanging block m2
      const w2 = 24 + state.m2 * 1.6, h2 = 24 + state.m2 * 1.0;
      const bx2 = px + pr, by2 = 150, m2cy = by2 + h2 / 2;
      ctx.fillStyle = cH + "22"; ctx.strokeStyle = cH; ctx.lineWidth = 1.6;
      ctx.fillRect(bx2 - w2 / 2, by2, w2, h2);
      ctx.strokeRect(bx2 - w2 / 2, by2, w2, h2);
      label("m_2", bx2, m2cy, cH);

      // rope
      ctx.strokeStyle = cT; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx1 + w1 / 2, tableY - 13);
      ctx.lineTo(px - pr, tableY - 13);
      ctx.moveTo(px + pr, py);
      ctx.lineTo(bx2, by2);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, pr, -Math.PI / 2, 0); ctx.stroke();

      // force arrows — one fixed N->px scale (max m2 g = 98 N -> ~78 px)
      const sc = 0.8;
      // tension on m1, toward the pulley (lifted above the rope line)
      arrow(ctx, bx1 + w1 / 2, tableY - 40, bx1 + w1 / 2 + M.FT * sc, tableY - 40, cT, { width: 3, head: 9, tailDot: true });
      label("F_T", bx1 + w1 / 2 + M.FT * sc + 8, tableY - 40, cT, "left");
      // on m2: tension up (left of block), weight down (right of block)
      arrow(ctx, bx2 - w2 / 2 - 7, m2cy, bx2 - w2 / 2 - 7, m2cy - M.FT * sc, cT, { width: 3, head: 9, tailDot: true });
      label("F_T", bx2 - w2 / 2 - 7, m2cy - M.FT * sc - 10, cT);
      arrow(ctx, bx2 + w2 / 2 + 7, m2cy, bx2 + w2 / 2 + 7, m2cy + M.ext * sc, cG, { width: 3, head: 9, tailDot: true });
      ctx.fillStyle = cG; ctx.font = "600 12px system-ui, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("m", bx2 + w2 / 2 + 14, m2cy + M.ext * sc + 12);
      ctx.font = "600 9px system-ui, sans-serif";
      ctx.fillText("2", bx2 + w2 / 2 + 24, m2cy + M.ext * sc + 15);
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.fillText("g", bx2 + w2 / 2 + 29, m2cy + M.ext * sc + 12);
      ctx.textAlign = "center";

      const nearStatic = M.a < 1.2;
      readout.innerHTML =
        `<p class="ipe__pair"><span class="ipe__k">System</span> total mass ${M.M} kg; the only external force along the motion is m₂g = <b>${M.ext.toFixed(0)} N</b>. &nbsp;⇒&nbsp; a = m₂g / (m₁+m₂) = <b>${M.a.toFixed(2)} m/s²</b>.</p>` +
        `<p><span class="ipe__k">m₁ alone</span> F_T = m₁a = <b>${M.FT.toFixed(1)} N</b>.</p>` +
        `<p><span class="ipe__k">m₂ alone</span> m₂g − F_T = m₂a  ⇒  F_T = m₂(g − a) = <b>${M.FTcheck.toFixed(1)} N</b> ✓ same tension.</p>` +
        `<p class="ipe__rule">F_T = <b>${M.FT.toFixed(1)} N</b> is ${nearStatic ? "nearly" : "well"} below the hanging weight m₂g = ${M.ext.toFixed(0)} N — the gap (m₂a) is the net force that accelerates m₂ downward. Make m₂ small next to m₁ and the acceleration shrinks, so F_T closes in on m₂g.</p>`;
    }

    if (insightEl) {
      insightEl.innerHTML =
        "<p>Use the <strong>system</strong> (both blocks as one mass, external forces only) to get the common acceleration fast. Then take <strong>one object at a time</strong> to get the rope tension — the internal force the system view can't see.</p><p>The tension never reaches m₂'s full weight while the system accelerates. Make the hanging block much lighter than the table block: the acceleration drops and F_T closes in on m₂g.</p>";
    }

    return draw;
  }

  register("connected-systems-explorer", mount);
})();
