/**
 * Shared scaffolding for the Canvas lesson interactives
 * (fbd-builder, center-of-mass-explorer, interaction-pair-explorer,
 * newtons-second-law-explorer, friction-explorer, …).
 *
 * Plain <script>, not an ES module — loaded on every lesson page BEFORE
 * the per-lesson component script, so each interactive can call
 * `window.PA.panel.*` instead of re-implementing the same boilerplate
 * (see js/content-loader.js for why nothing here can be an ES module).
 *
 * What it factors out:
 *   - cssVar(name, fallback)  — read a CSS custom property off <body>
 *   - arrow(ctx, x1,y1,x2,y2, color, opts) — a straight arrow with a
 *     filled head and an optional tail dot
 *   - register(componentKey, setup) — find the section build.js emitted
 *     for this componentKey, hand its panel elements to setup(), and
 *     re-run the redraw fn setup returns whenever the slide is shown or
 *     the window resizes.
 */
(function () {
  window.PA = window.PA || {};
  if (window.PA.panel) return;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  /**
   * @param opts {{ width?, head?, spread?, round?, tailDot?: boolean|number }}
   */
  function arrow(ctx, x1, y1, x2, y2, color, opts) {
    const o = opts || {};
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = o.width || 3;
    if (o.round) ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.lineCap = "butt";
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = o.head || 10;
    const spread = o.spread || Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - spread), y2 - h * Math.sin(a - spread));
    ctx.lineTo(x2 - h * Math.cos(a + spread), y2 - h * Math.sin(a + spread));
    ctx.closePath();
    ctx.fill();
    if (o.tailDot) {
      ctx.beginPath();
      ctx.arc(x1, y1, o.tailDot === true ? 2.5 : o.tailDot, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function register(componentKey, setup) {
    function go() {
      const container = document.querySelector('[data-component-key="' + componentKey + '"]');
      if (!container) return;
      const controls = container.querySelector(".interactive-panel__controls");
      if (!controls) return;
      const els = {
        container: container,
        controls: controls,
        canvasWrap: container.querySelector(".interactive-panel__canvas-wrap"),
        promptEl: container.querySelector(".sim-prompt"),
        insightEl: container.querySelector(".sim-insight"),
        readoutsEl: container.querySelector(".sim-readouts"),
        lockRowEl: container.querySelector(".sim-lock-row"),
        graphsEl: container.querySelector(".sim-graphs"),
      };
      let redraw;
      try {
        redraw = setup(els);
      } catch (err) {
        console.error("[interactive-panel] " + componentKey + " failed to mount:", err);
        return;
      }
      if (typeof redraw === "function") {
        const slide = container.closest(".slide");
        if (slide) slide.addEventListener("slide:shown", redraw);
        window.addEventListener("resize", redraw);
        redraw();
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", go);
    } else {
      go();
    }
  }

  window.PA.panel = { cssVar: cssVar, arrow: arrow, register: register };
})();
