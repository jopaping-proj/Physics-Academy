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
      "Box free-body diagram of a sled on frictionless ice. Gravity down from the centre and the normal force up from the bottom surface are equal and cancel. Three horizontal forces: a forward push and a longer forward pull, both from the back face, and a short backward wind force. The forward forces together beat the wind, so the net force is forward.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [134, 134], color: "blue" },
      { sym: "F_push", dir: "right", mag: 4, anchor: [116, 100], color: "amber" },
      { sym: "F_pull", dir: "right", mag: 5, anchor: [116, 124], color: "green", label: { lift: 6 } },
      { sym: "F_wind", dir: "left", mag: 2, anchor: [184, 112], color: "violet" },
    ],
  },

  "multi-force/fbd-angled-pull-accel.svg": {
    style: "box",
    surface: { side: "bottom" },
    angles: [{ deg: 30, side: "right", label: "30°", at: [176, 90], r: 22 }],
    ariaLabel:
      "Box free-body diagram of a crate pulled across a rough floor by a rope at 30 degrees above the horizontal while speeding up. Gravity down from the centre. The normal force up from the bottom surface, drawn shorter than gravity because the rope lifts part of the weight. Kinetic friction to the left along the bottom surface, drawn short. The rope tension up and to the right at 30 degrees, drawn as the longest arrow. An arc marks the 30-degree angle.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 2, anchor: [134, 134], color: "blue" },
      { sym: "F_T", dir: 30, mag: 5, anchor: [176, 90], color: "amber" },
      { sym: "f", dir: "left", mag: 2, anchor: [168, 134], color: "red", label: { lift: 14 } },
    ],
  },

  "multi-force/dot-three-forces.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a block on ice with three horizontal forces: 12 newtons east and 8 newtons east (both to the right), and 6 newtons west (to the left). The eastward forces are longer, so the net force is 14 newtons east.",
    forces: [
      { sym: "12 N", dir: "right", len: 72, anchor: [159, 103], color: "amber" },
      { sym: "8 N", dir: "right", len: 48, anchor: [159, 121], color: "green" },
      { sym: "6 N", dir: "left", len: 36, anchor: [141, 112], color: "violet" },
    ],
  },

  "multi-force/dot-perpendicular.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a puck pushed by two perpendicular forces: 6 newtons north (up) and 8 newtons east (right). Their resultant, drawn dashed, is 10 newtons to the north-east.",
    forces: [
      { sym: "6 N", dir: "up", mag: 3, anchor: [150, 104], color: "blue" },
      { sym: "8 N", dir: "right", mag: 4, anchor: [158, 112], color: "green" },
      { sym: "F_net", dir: 37, mag: 5, anchor: [156, 106], color: "amber", dashed: true },
    ],
  },

  "multi-force/dot-lawnmower.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a lawnmower pushed along level ground by a handle pointing down and forward at 40 degrees below the horizontal. Gravity down, the normal force up (drawn longer than gravity), and the push down-and-forward. The normal force exceeds the weight because the push has a downward part.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: "up", mag: 4, anchor: [150, 104], color: "blue" },
      { sym: "F_push", dir: -40, mag: 4, anchor: [156, 118], color: "amber" },
    ],
  },

  "multi-force/dot-angled-rope.svg": {
    style: "dot",
    dot: { r: 8 },
    angles: [{ deg: 25, side: "right", label: "θ" }],
    ariaLabel:
      "Dot free-body diagram of a box dragged across a floor by a rope at angle theta above the horizontal. Gravity down, the normal force up (shorter than gravity because the rope lifts part of the weight), friction to the left, and the rope tension up and to the right at theta.",
    forces: [
      { sym: "F_g", dir: "down", mag: 4, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: "up", mag: 2, anchor: [150, 104], color: "blue" },
      { sym: "f", dir: "left", mag: 3, anchor: [142, 112], color: "red" },
      { sym: "F_T", dir: 25, mag: 4, anchor: [158, 108], color: "amber" },
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

  // ---- Lesson 7 · Friction: Static and Kinetic ----
  "friction/fbd-push-not-sliding.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a heavy crate being pushed horizontally but not moving. Gravity down from the centre and the normal force up from the bottom surface are equal. The applied push to the right and the static friction force to the left, along the bottom surface, are also exactly equal — static friction has grown to match the push, so the crate stays in equilibrium.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [134, 134], color: "blue" },
      { sym: "F_app", dir: "right", mag: 4, anchor: [116, 104], color: "amber" },
      { sym: "f_s", dir: "left", mag: 4, anchor: [166, 134], color: "red", label: { lift: 14 } },
    ],
  },

  "friction/fbd-sliding.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a crate sliding to the right across a rough floor while speeding up. Gravity down from the centre and the normal force up from the bottom surface are equal. The applied push to the right is the longest arrow. Kinetic friction to the left along the bottom surface is fixed and shorter than the push, so the net force is to the right.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [134, 134], color: "blue" },
      { sym: "F_app", dir: "right", mag: 5, anchor: [116, 104], color: "amber" },
      { sym: "f_k", dir: "left", mag: 2, anchor: [166, 134], color: "red", label: { lift: 14 } },
    ],
  },

  "friction/dot-sliding-nopush.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a box sliding to the right with nobody pushing it. Gravity down and the normal force up are equal and cancel. Kinetic friction is the only horizontal force, pointing left, opposite the sliding, so the box decelerates.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [150, 104], color: "blue" },
      { sym: "f_k", dir: "left", mag: 3, anchor: [142, 112], color: "red" },
    ],
  },

  // ---- Lesson 8 · Connected Objects and Systems ----
  "connected/fbd-table-block.svg": {
    style: "box",
    surface: { side: "bottom" },
    ariaLabel:
      "Box free-body diagram of a block on a frictionless table connected by a rope that runs to the right toward a pulley. Gravity down from the centre and the normal force up from the bottom surface are equal. The rope tension acts to the right, from the right face — the only horizontal force, so the block accelerates toward the pulley.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 112], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [134, 134], color: "blue" },
      { sym: "F_T", dir: "right", mag: 4, anchor: [184, 108], color: "amber" },
    ],
  },

  "connected/fbd-hanging-block.svg": {
    style: "box",
    box: { hw: 24, hh: 28 },
    ariaLabel:
      "Box free-body diagram of a block hanging from a rope and accelerating downward. The rope tension acts up from the top face. Gravity acts down from the centre and is the longer arrow, so the net force — and the acceleration — point downward. The tension is therefore less than the weight.",
    forces: [
      { sym: "F_T", dir: "up", mag: 3, anchor: [150, 84], color: "amber" },
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 112], color: "grey" },
    ],
  },

  "connected/dot-table-block.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of the block on the frictionless table. Gravity down and the normal force up are equal and cancel. The rope tension is the only horizontal force, pointing right toward the pulley, so it alone gives the block's acceleration: F_T = m a.",
    forces: [
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: "up", mag: 3, anchor: [150, 104], color: "blue" },
      { sym: "F_T", dir: "right", mag: 4, anchor: [158, 112], color: "amber" },
    ],
  },

  "connected/dot-hanging-block.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of the hanging block. Two vertical forces: the rope tension up and gravity down. Gravity is the longer arrow, so the net force is downward and the block accelerates down — which means the tension is less than the weight, F_T = m(g - a).",
    forces: [
      { sym: "F_T", dir: "up", mag: 3, anchor: [150, 104], color: "amber" },
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 120], color: "grey" },
    ],
  },

  "connected/dot-elevator-bag.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a bag on the floor of an elevator that accelerates upward. Two vertical forces: the floor's normal force up and gravity down. The normal force is the longer arrow, because the floor must support the bag's weight and also accelerate it upward: F_N = m(g + a).",
    forces: [
      { sym: "F_N", dir: "up", mag: 5, anchor: [150, 104], color: "blue" },
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
    ],
  },

  // ---- Lesson 9 · Gravitation, Springs, and Apparent Weight ----
  // ---- Lesson 10 · Inclined Planes ----
  "incline/dot-frictionless.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a block on a frictionless incline that rises to the right at angle theta. Only two forces: gravity straight down (the longer arrow), and the normal force perpendicular to the surface, pointing up and to the left (shorter than gravity, because it equals m g cosine theta). The two do not cancel, so the net force points down the slope.",
    forces: [
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: 120, mag: 3, anchor: [146, 105], color: "blue" },
    ],
  },

  "incline/dot-friction.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a block sliding down a rough incline that rises to the right at angle theta. Three forces: gravity straight down (the longest arrow); the normal force perpendicular to the surface, up and to the left; and kinetic friction along the surface, pointing up the slope (up and to the right), opposing the downhill slide.",
    forces: [
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 120], color: "grey" },
      { sym: "F_N", dir: 120, mag: 3, anchor: [146, 105], color: "blue" },
      { sym: "f_k", dir: 30, mag: 2, anchor: [158, 106], color: "red" },
    ],
  },

  "apparent-weight/dot-accel-up.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a person on a scale in an elevator accelerating upward. The scale's normal force acts up and is the longer arrow; gravity acts down and is shorter. Net force is upward, so F_N is greater than mg and the scale reads high.",
    forces: [
      { sym: "F_N", dir: "up", mag: 5, anchor: [150, 104], color: "blue" },
      { sym: "F_g", dir: "down", mag: 3, anchor: [150, 120], color: "grey" },
    ],
  },

  "apparent-weight/dot-accel-down.svg": {
    style: "dot",
    dot: { r: 8 },
    ariaLabel:
      "Dot free-body diagram of a person on a scale in an elevator accelerating downward. The scale's normal force acts up and is the shorter arrow; gravity acts down and is longer. Net force is downward, so F_N is less than mg and the scale reads low.",
    forces: [
      { sym: "F_N", dir: "up", mag: 3, anchor: [150, 104], color: "blue" },
      { sym: "F_g", dir: "down", mag: 5, anchor: [150, 120], color: "grey" },
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
