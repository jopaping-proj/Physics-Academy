/**
 * Free-body-diagram SVG generator.
 *
 * Draws the object (box or dot), an optional contact surface, and one
 * arrow + label per force — with label positions computed so that
 * **no label overlaps the object, an arrow, or another label**
 * (master-project-prompt.md §11). The viewBox is fitted to the finished
 * content, so pushing a label outward to clear a collision never clips
 * it.
 *
 * Used by build/gen-diagrams.js to (re)generate the checked-in SVGs
 * under assets/diagrams/. Keep it dependency-free.
 *
 *   renderFbdSvg({
 *     style: "box" | "dot",
 *     ariaLabel: "…",
 *     box: { hw, hh },            // box style
 *     dot: { r },                 // dot style
 *     surface: { side: "bottom"|"left" },   // optional contact surface
 *     forces: [
 *       { sym: "F_g", dir: "down" | <deg>, mag: 1..5,
 *         anchor: [x, y],          // tail, in the same coords as the object centre (150,110)
 *         len,                     // optional px override (else 30 + mag*15)
 *         color: "grey"|"blue"|"amber"|"red"|"green",
 *         dashed: false }
 *     ]
 *   })
 */

const COLORS = {
  grey: "#8b96a5",
  blue: "#58a6ff",
  amber: "#f0c27a",
  red: "#f85149",
  green: "#3fb950",
  violet: "#b98cf0",
  object: "#e6edf3",
  surface: "#8b96a5",
};

const NAMED_DIRS = {
  up: 90, down: -90, left: 180, right: 0,
  "up-right": 45, "up-left": 135, "down-right": -45, "down-left": -135,
};

const FS = 13;          // label font size
const SUB_FS = 9;       // subscript font size
const CX = 150;         // object centre (fixed; viewBox is fitted afterwards)
const CY = 112;

function unit(dir) {
  const deg = typeof dir === "number" ? dir : NAMED_DIRS[dir];
  const rad = (deg * Math.PI) / 180;
  // screen coords: y grows downward, so negate the y of a standard CCW angle
  return [Math.cos(rad), -Math.sin(rad)];
}

function splitSym(sym) {
  const m = /^([A-Za-z\\]+)_(\{?)([^}]+)\}?$/.exec(sym);
  if (m) return { main: m[1], sub: m[3] };
  return { main: sym, sub: "" };
}

// rough text box (px). main glyph ~0.62·fs wide, subscript glyphs ~0.5·subfs.
function textMetrics(sym) {
  const { main, sub } = splitSym(sym);
  const w = main.length * FS * 0.62 + sub.length * SUB_FS * 0.62;
  return { w, h: FS, main, sub };
}

function rectsOverlap(a, b, pad = 0) {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

// shortest distance from point P to segment AB
function distPointSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function rectSegClear(rect, seg, minClear) {
  // sample the rect perimeter + centre against the segment
  const pts = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w / 2, rect.y + rect.h / 2],
    [rect.x + rect.w / 2, rect.y],
    [rect.x + rect.w / 2, rect.y + rect.h],
    [rect.x, rect.y + rect.h / 2],
    [rect.x + rect.w, rect.y + rect.h / 2],
  ];
  return pts.every(([x, y]) => distPointSeg(x, y, seg.x1, seg.y1, seg.x2, seg.y2) >= minClear);
}

function labelRect(lx, ly, anchorH, anchorV, m) {
  let x = lx;
  if (anchorH === "middle") x = lx - m.w / 2;
  else if (anchorH === "end") x = lx - m.w;
  let y = ly;
  if (anchorV === "middle") y = ly - m.h / 2;
  else if (anchorV === "baseline") y = ly - m.h; // text sits above the anchor
  // "hanging": text sits below the anchor -> y = ly
  return { x, y, w: m.w, h: m.h };
}

export function renderFbdSvg(spec) {
  const isDot = spec.style === "dot";
  const box = spec.box || { hw: 34, hh: 22 };
  const dotR = (spec.dot && spec.dot.r) || 8;

  const obstacles = []; // arrow segments, for label placement
  const objRect = isDot
    ? { x: CX - dotR, y: CY - dotR, w: dotR * 2, h: dotR * 2 }
    : { x: CX - box.hw, y: CY - box.hh, w: box.hw * 2, h: box.hh * 2 };

  const placedLabels = [];
  const bbox = { minX: objRect.x, minY: objRect.y, maxX: objRect.x + objRect.w, maxY: objRect.y + objRect.h };
  const grow = (x, y) => {
    bbox.minX = Math.min(bbox.minX, x);
    bbox.minY = Math.min(bbox.minY, y);
    bbox.maxX = Math.max(bbox.maxX, x);
    bbox.maxY = Math.max(bbox.maxY, y);
  };

  const arrowParts = [];
  const labelParts = [];
  const usedColors = new Set();

  // first pass: geometry of every arrow
  const arrows = spec.forces.map((f) => {
    const [ux, uy] = unit(f.dir);
    const len = f.len != null ? f.len : 18 + (f.mag != null ? f.mag : 3) * 15;
    const [ax, ay] = f.anchor;
    const tip = [ax + ux * len, ay + uy * len];
    return { f, ux, uy, len, ax, ay, tx: tip[0], ty: tip[1] };
  });
  arrows.forEach((a) => {
    obstacles.push({ x1: a.ax, y1: a.ay, x2: a.tx, y2: a.ty });
  });

  // the contact surface + its hatching is a keep-out for labels too — but
  // not for the label of a force that legitimately runs ALONG that surface
  // (friction), which is why these are tagged `isSurface`.
  if (spec.surface) {
    if (spec.surface.side === "bottom") {
      const y = objRect.y + objRect.h;
      obstacles.push({ x1: CX - 200, y1: y, x2: CX + 200, y2: y, isSurface: true });
      obstacles.push({ x1: CX - 200, y1: y + 10, x2: CX + 200, y2: y + 10, isSurface: true });
    } else if (spec.surface.side === "left") {
      const x = objRect.x;
      obstacles.push({ x1: x, y1: CY - 200, x2: x, y2: CY + 200, isSurface: true });
      obstacles.push({ x1: x - 10, y1: CY - 200, x2: x - 10, y2: CY + 200, isSurface: true });
    }
  }

  // second pass: draw + place labels
  for (const a of arrows) {
    const { f, ux, uy, ax, ay, tx, ty } = a;
    const color = COLORS[f.color] || COLORS.grey;
    usedColors.add(f.color || "grey");
    const dash = f.dashed ? ` stroke-dasharray="5 4"` : "";
    arrowParts.push(
      `  <line x1="${r(ax)}" y1="${r(ay)}" x2="${r(tx)}" y2="${r(ty)}" stroke="${color}" stroke-width="${f.dashed ? 2 : 3}"${dash} marker-end="url(#fbd-${f.color || "grey"})"/>`
    );
    grow(ax, ay);
    grow(tx, ty);

    const m = textMetrics(f.sym);
    // where the label search starts: normally just past the arrowhead,
    // growing outward along the arrow. `label.atTail` seeds it beside the
    // TAIL instead (for a force whose head points at a wall/obstacle).
    const hint = f.label || null;
    let anchorH, anchorV, originX, originY, alongX, alongY;
    if (hint && hint.atTail) {
      originX = ax + (hint.dx || 0);
      originY = ay + (hint.dy || 0);
      anchorH = hint.anchor || (hint.dx < 0 ? "end" : "start");
      anchorV = "middle";
      alongX = Math.sign(hint.dx || 1);
      alongY = 0;
    } else {
      originX = tx;
      originY = ty;
      anchorH = ux > 0.3 ? "start" : ux < -0.3 ? "end" : "middle";
      anchorV = uy > 0.3 ? "hanging" : uy < -0.3 ? "baseline" : "middle";
      alongX = ux;
      alongY = uy;
    }

    // `label.lift` raises the seed off a bottom surface (a friction label
    // lifted clear of the floor it slides along); such a label also ignores
    // the surface obstacles.
    const lift = hint && hint.lift ? hint.lift : 0;
    let step = hint && hint.atTail ? 0 : 8;
    const seed = () => {
      let x = originX + alongX * step + (anchorH === "start" ? 2 : anchorH === "end" ? -2 : 0);
      let y = originY + alongY * step - lift + (anchorV === "hanging" ? 2 : anchorV === "baseline" ? -3 : 0);
      return [x, y];
    };
    let [lx, ly] = seed();
    let rect = labelRect(lx, ly, anchorH, anchorV, m);

    let guard = 0;
    while (guard++ < 40) {
      const hitsObject = rectsOverlap(rect, objRect, 3);
      const hitsArrow = obstacles.some((s) => (lift && s.isSurface ? false : !rectSegClear(rect, s, 4)));
      const hitsLabel = placedLabels.some((L) => rectsOverlap(rect, L, 3));
      if (!hitsObject && !hitsArrow && !hitsLabel) break;
      step += 5;
      [lx, ly] = seed();
      if (guard > 8) {
        const [px, py] = [-alongY, alongX];
        const bias = (guard - 8) * 3 * (guard % 2 ? 1 : -1);
        lx += px * bias;
        ly += py * bias;
      }
      rect = labelRect(lx, ly, anchorH, anchorV, m);
    }
    if (guard >= 40) {
      throw new Error(`fbd-svg: could not place label "${f.sym}" without overlap`);
    }

    placedLabels.push(rect);
    grow(rect.x, rect.y);
    grow(rect.x + rect.w, rect.y + rect.h);

    const italic = m.main === "f" ? ' font-style="italic"' : "";
    const baseAttr = anchorV === "baseline" ? "auto" : anchorV === "hanging" ? "hanging" : "central";
    // two <text> elements (proven cross-renderer) instead of a sub-tspan:
    // shift so the whole "F" + subscript block honours text-anchor.
    const mainGlyphW = FS * 0.6;
    const left =
      anchorH === "start" ? lx : anchorH === "end" ? lx - m.w : lx - m.w / 2;
    const common = `text-anchor="start" dominant-baseline="${baseAttr}" font-family="system-ui, sans-serif" fill="${color}"`;
    labelParts.push(
      `  <text x="${r(left)}" y="${r(ly)}" ${common} font-size="${FS}" font-weight="600"${italic}>${m.main}</text>`
    );
    if (m.sub) {
      labelParts.push(
        `  <text x="${r(left + mainGlyphW)}" y="${r(ly + 3.5)}" ${common} font-size="${SUB_FS}" font-weight="600">${m.sub}</text>`
      );
    }
  }

  // angle marks: an arc between the horizontal and a ray at `deg`, with a
  // short dashed horizontal reference and a label. Drawn at the object
  // centre, or at `at: [x,y]` (e.g. the tail of the angled force).
  // spec.angles: [{ deg, side: "right"|"left", label, at }]
  const angleParts = [];
  for (const ang of spec.angles || []) {
    const R = ang.r || 26;
    const right = ang.side !== "left";
    const deg = ang.deg;
    const [ox, oy] = ang.at || [CX, CY];
    const base = right ? 0 : 180;
    const rad0 = (base * Math.PI) / 180;
    const rad1 = ((right ? deg : 180 - deg) * Math.PI) / 180;
    const sx = ox + R * Math.cos(rad0);
    const sy = oy - R * Math.sin(rad0);
    const ex = ox + R * Math.cos(rad1);
    const ey = oy - R * Math.sin(rad1);
    const sweep = right ? 0 : 1;
    angleParts.push(
      `  <line x1="${r(ox)}" y1="${r(oy)}" x2="${r(sx + (right ? 6 : -6))}" y2="${r(oy)}" stroke="${COLORS.surface}" stroke-width="1" stroke-dasharray="3 2"/>`,
      `  <path d="M ${r(sx)} ${r(sy)} A ${R} ${R} 0 0 ${sweep} ${r(ex)} ${r(ey)}" fill="none" stroke="${COLORS.surface}" stroke-width="1.2"/>`
    );
    // place the label in the open wedge, a bit past the arc; for a narrow
    // wedge (small angle) sit it a touch above the mid-line so it reads clear.
    const labelDeg = deg < 25 ? deg * 0.75 + 5 : deg / 2;
    const midRad = ((right ? labelDeg : 180 - labelDeg) * Math.PI) / 180;
    const lr = R + 16;
    const lx = ox + lr * Math.cos(midRad);
    const ly = oy - lr * Math.sin(midRad);
    angleParts.push(
      `  <text x="${r(lx)}" y="${r(ly)}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="11" fill="${COLORS.surface}">${escapeAttr(ang.label || deg + "°")}</text>`
    );
    grow(lx - 12, ly - 9);
    grow(lx + 12, ly + 9);
    grow(right ? sx + 8 : sx - 8, CY);
  }

  // optional kinematic annotation: a dashed acceleration arrow drawn BESIDE
  // the object (it is not a force, so it never starts at the object), with
  // its own italic label. spec.accel: { dir, label?, color? }
  const accelParts = [];
  if (spec.accel) {
    const [aux, auy] = unit(spec.accel.dir);
    const acol = COLORS[spec.accel.color] || COLORS.green;
    const gap = (isDot ? dotR : box.hw) + 30;
    const ox = CX + gap;
    const half = 20;
    const x1 = ox - aux * half, y1 = CY - auy * half;
    const x2 = ox + aux * half, y2 = CY + auy * half;
    usedColors.add(spec.accel.color || "green");
    accelParts.push(
      `  <line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${acol}" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#fbd-${spec.accel.color || "green"})"/>`
    );
    const lx = ox + 12;
    accelParts.push(
      `  <text x="${r(lx)}" y="${r(CY)}" text-anchor="start" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="${FS}" font-weight="600" font-style="italic" fill="${acol}">${escapeAttr(spec.accel.label || "a")}</text>`
    );
    grow(x1, y1);
    grow(x2, y2);
    grow(lx + 12, CY);
  }

  // surface (drawn last-but-under; add to bbox)
  let surfaceParts = "";
  if (spec.surface) {
    const side = spec.surface.side;
    if (side === "bottom") {
      const y = objRect.y + objRect.h;
      const x1 = bbox.minX - 6;
      const x2 = bbox.maxX + 6;
      surfaceParts = surfaceLine(x1, x2, y, "bottom");
      grow(x1, y + 10);
      grow(x2, y);
    } else if (side === "left") {
      const x = objRect.x;
      const y1 = bbox.minY - 6;
      const y2 = bbox.maxY + 6;
      surfaceParts = surfaceLine(y1, y2, x, "left");
      grow(x - 10, y1);
      grow(x, y2);
    }
  }

  const pad = 5;
  const vbX = Math.floor(bbox.minX - pad);
  const vbY = Math.floor(bbox.minY - pad);
  const vbW = Math.ceil(bbox.maxX - bbox.minX + pad * 2);
  const vbH = Math.ceil(bbox.maxY - bbox.minY + pad * 2);

  // markerUnits="userSpaceOnUse" so the head is a fixed size, not scaled
  // by stroke-width.
  const defs = [...usedColors]
    .map(
      (c) =>
        `    <marker id="fbd-${c}" viewBox="0 0 10 10" refX="8.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 1 L10 5 L0 9 z" fill="${COLORS[c]}"/></marker>`
    )
    .join("\n");

  const objectPart = isDot
    ? `  <circle cx="${CX}" cy="${CY}" r="${dotR}" fill="${COLORS.object}"/>`
    : `  <rect x="${r(objRect.x)}" y="${r(objRect.y)}" width="${objRect.w}" height="${objRect.h}" rx="3" fill="${COLORS.object}" fill-opacity="0.05" stroke="${COLORS.object}" stroke-width="1.5"/>\n  <circle cx="${CX}" cy="${CY}" r="2.4" fill="${COLORS.object}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" role="img"
     aria-label="${escapeAttr(spec.ariaLabel || "Free-body diagram")}">
  <!-- Generated by build/gen-diagrams.js — do not hand-edit.
       Labels are auto-placed clear of the object, the arrows, and each
       other (master-project-prompt.md §11). -->
  <defs>
${defs}
  </defs>
${surfaceParts}${objectPart}
${arrowParts.join("\n")}${accelParts.length ? "\n" + accelParts.join("\n") : ""}
${angleParts.join("\n")}
${labelParts.join("\n")}
</svg>
`;
}

function surfaceLine(a, b, fixed, side) {
  if (side === "bottom") {
    const ticks = [];
    for (let x = a + 10; x < b; x += 22) ticks.push(`<line x1="${r(x)}" y1="${fixed}" x2="${r(x - 8)}" y2="${fixed + 10}"/>`);
    return `  <line x1="${r(a)}" y1="${fixed}" x2="${r(b)}" y2="${fixed}" stroke="${COLORS.surface}" stroke-width="1.5"/>\n  <g stroke="${COLORS.surface}" stroke-width="1.1">${ticks.join("")}</g>\n`;
  }
  const ticks = [];
  for (let y = a + 10; y < b; y += 22) ticks.push(`<line x1="${fixed}" y1="${r(y)}" x2="${fixed - 10}" y2="${r(y + 8)}"/>`);
  return `  <line x1="${fixed}" y1="${r(a)}" x2="${fixed}" y2="${r(b)}" stroke="${COLORS.surface}" stroke-width="1.5"/>\n  <g stroke="${COLORS.surface}" stroke-width="1.1">${ticks.join("")}</g>\n`;
}

function r(n) {
  return Math.round(n * 10) / 10;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export { CX, CY };
