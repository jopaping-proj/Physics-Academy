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
      { sym: "f", dir: "left", mag: 3, anchor: [166, 134], color: "red", label: { lift: 14 } },
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
      { sym: "f", dir: "left", mag: 3, anchor: [166, 134], color: "red", label: { lift: 14 } },
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

  // ---- Lesson 3 · Newton's First Law and Equilibrium ----
  "first-law/fbd-crate-constant-v.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a crate being dragged across a level floor at constant velocity by a horizontal rope. Four forces, all equal in length: gravity down from the centre, the normal force up from the bottom surface, the rope tension to the right from the back face, and friction to the left along the bottom surface. Every force is balanced by an equal and opposite one.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [138, 134], color: "blue" },
      { sym: "F_T", dir: "right", mag: 3, anchor: [116, 108], color: "amber" },
      { sym: "f", dir: "left", mag: 3, anchor: [168, 134], color: "red", label: { lift: 14 } },
    ],
  },

  "first-law/fbd-lamp-two-cables.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a lamp hanging at rest from two cables, each 30 degrees above the horizontal. Gravity acts straight down. Each cable's tension acts up and outward at 30 degrees; the two tensions are equal. An arc marks the 30-degree angle between the right cable and the horizontal.",
    angles: [{ deg: 30, side: "right", label: "30°" }],
    forces: [
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 120], color: "grey" },
      { sym: "F_T", dir: 150, mag: 4, anchor: [143, 108], color: "amber" },
      { sym: "F_T", dir: 30, mag: 4, anchor: [157, 108], color: "amber" },
    ],
  },

  // ---- Lesson 5 · Newton's Second Law: multi-force / two-axis ----
  "multi-force/fbd-three-forces.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a sled on frictionless ice. Gravity down from the centre and the normal force up from the bottom surface are equal and cancel. Three horizontal forces: a long forward push and a shorter forward pull, both from the back face, and a short backward wind force from the front face. The forward forces together beat the wind, so the net force is forward.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [134, 134], color: "blue" },
      { sym: "F_push", dir: "right", mag: 5, anchor: [116, 99], color: "amber" },
      { sym: "F_pull", dir: "right", mag: 4, anchor: [116, 125], color: "green" },
      { sym: "F_wind", dir: "left", mag: 2, anchor: [184, 112], color: "violet", label: { atTail: true, dx: 8, dy: 0, anchor: "start" } },
    ],
  },

  "multi-force/fbd-angled-pull-accel.svg": {
    style: "box",
    surface: { side: "bottom" },
    angles: [{ deg: 30, side: "right", label: "30°" }],
    ariaLabel:
      "Box free-body diagram of a crate pulled across a rough floor by a rope at 30 degrees above the horizontal while speeding up. Gravity down from the centre. The normal force up from the bottom surface, drawn shorter than gravity because the rope lifts part of the weight. Kinetic friction to the left along the bottom surface, drawn short. The rope tension up and to the right at 30 degrees, drawn as the longest arrow. An arc marks the 30-degree angle.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 2, anchor: [134, 134], color: "blue" },
      { sym: "F_T", dir: 30, mag: 5, anchor: [176, 90], color: "amber" },
      { sym: "f", dir: "left", mag: 2, anchor: [168, 134], color: "red", label: { lift: 14 } },
    ],
  },

  "first-law/fbd-traffic-light.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a traffic light hanging from the midpoint of a nearly horizontal cable. Gravity acts straight down. Each half of the cable pulls up and outward at only 15 degrees above the horizontal, so each tension arrow is long — much longer than the weight. An arc marks the 15-degree angle between the right half and the horizontal.",
    angles: [{ deg: 15, side: "right", label: "15°" }],
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
      { sym: "T_1", dir: 165, mag: 5, anchor: [142, 110], color: "amber" },
      { sym: "T_2", dir: 15, mag: 5, anchor: [158, 110], color: "amber" },
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
