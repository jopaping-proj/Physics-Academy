#!/usr/bin/env node
/**
 * Regenerates the checked-in free-body-diagram SVGs from declarative
 * specs, using build/render/fbd-svg.js (which auto-places every label
 * clear of the object, the arrows, and the other labels — §11).
 *
 * Run from physics-repository/:  node build/gen-diagrams.js
 * Re-run whenever a diagram spec changes. The output is deterministic.
 */
import fs from "node:fs";
import path from "node:path";
import { renderFbdSvg } from "./render/fbd-svg.js";
import { DIAGRAMS_DIR } from "./render/paths.js";

// object centre is fixed at (150, 112) inside fbd-svg.js
const C = [150, 112];

const DIAGRAMS = {
  "forces-fbd/fbd-book.svg": {
    style: "box",
    box: { hw: 30, hh: 12 },
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a book resting on a table. Gravity acts down, starting at the book's centre. The normal force acts up, starting at the book's bottom surface. The two arrows are equal in length because the book is in equilibrium.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [141, 124], color: "blue" },
    ],
  },

  "forces-fbd/fbd-pushed-crate.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a crate pushed to the right across a rough floor while speeding up. Gravity acts down from the centre. The normal force acts up from the bottom surface. The applied push acts to the right, starting at the crate's left (back) face, and is the longest arrow. Kinetic friction acts to the left along the bottom surface and is shorter than the push, so the net force is to the right.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [138, 134], color: "blue" },
      { sym: "F_app", dir: "right", mag: 5, anchor: [116, 108], color: "amber" },
      { sym: "f", dir: "left", mag: 3, anchor: [166, 134], color: "red" },
    ],
  },

  "forces-fbd/fbd-pushed-crate-dot.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of the same crate being pushed to the right while speeding up. The crate is a single small dot. Four forces start at the edge of the dot: gravity down, the normal force up and equal in length to gravity, a long applied-push arrow to the right, and a shorter kinetic-friction arrow to the left.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [150, 104], color: "blue" },
      { sym: "F_app", dir: "right", mag: 5, anchor: [158, 112], color: "amber" },
      { sym: "f", dir: "left", mag: 3, anchor: [142, 112], color: "red" },
    ],
  },

  "forces-fbd/fbd-dragged-crate.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a crate dragged at constant speed across a rough floor by a rope pulling up and to the right at 30 degrees above horizontal. Gravity acts down from the centre. The normal force acts up from the bottom surface and is shorter than gravity because the rope carries part of the weight. Tension acts up and to the right at 30 degrees, starting at the top of the crate. Kinetic friction acts to the left along the bottom surface.",
    forces: [
      { sym: "F_g", dir: "down", mag: 4, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 2, anchor: [136, 134], color: "blue" },
      { sym: "F_T", dir: 30, mag: 5, anchor: [176, 90], color: "amber" },
      { sym: "f", dir: "left", mag: 3, anchor: [166, 134], color: "red" },
    ],
  },

  "forces-fbd/fbd-wall-block.svg": {
    style: "box",
    box: { hw: 28, hh: 34 },
    surface: { side: "left" },
    ariaLabel:
      "Box free-body diagram of a block held against a vertical wall on its left by a horizontal push. Gravity acts down from the centre. The applied push acts to the left into the wall, starting at the block's right face. The wall's normal force acts to the right, starting at the block's left face. Static friction from the wall acts straight up, starting at the block's left face. The push equals the normal force; friction equals gravity.",
    forces: [
      { sym: "F_g", dir: "down", mag: 4, anchor: [150, 112], color: "grey" },
      // push and normal drawn equal (F_app = F_N); the push head stays
      // inside the block (it points at the wall), so its label rides the tail
      { sym: "F_app", dir: "left", len: 44, anchor: [178, 100], color: "amber", label: { atTail: true, dx: 6, dy: 0, anchor: "start" } },
      { sym: "F_N", dir: "right", len: 44, anchor: [122, 126], color: "blue" },
      { sym: "f", dir: "up", mag: 4, anchor: [127, 142], color: "red" },
    ],
  },

  "forces-fbd/fbd-wall-block-dot.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of the block held against a wall. The block is one small dot. Four forces start at the edge of the dot: gravity down and static friction up, equal in length; the applied push to the left and the wall's normal force to the right, equal in length.",
    forces: [
      { sym: "F_g", dir: "down", mag: 4, anchor: [150, 120], color: "grey" },
      { sym: "f", dir: "up", mag: 4, anchor: [150, 104], color: "red" },
      { sym: "F_app", dir: "left", mag: 4, anchor: [142, 112], color: "amber" },
      { sym: "F_N", dir: "right", mag: 4, anchor: [158, 112], color: "blue" },
    ],
  },
};

let n = 0;
for (const [rel, spec] of Object.entries(DIAGRAMS)) {
  const out = path.join(DIAGRAMS_DIR, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderFbdSvg(spec), "utf8");
  console.log(`[gen-diagrams] assets/diagrams/${rel}`);
  n++;
}
console.log(`[gen-diagrams] ${n} diagram(s) written.`);
void C;
