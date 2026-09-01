#!/usr/bin/env node
/**
 * One-shot migration (architecture §10.4 / §12.13).
 *
 * Adds `objective` (C-prefixed cluster), `cedTopic`, and `clusterId` to
 * every concept-inventory item, so the diagnostic can later feed a
 * per-cluster internal analysis ("watch this in Lesson N"). The cluster
 * is the one whose sub-outcome the item's *correct* answer depends on —
 * assigned per item below, not derived from `misconception` (a pair can
 * span two clusters).
 *
 * Idempotent. Run from physics-repository/:
 *   node build/migrations/2026-09-01-concept-inventory-tags.js
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../render/paths.js";

const CED = {
  "C2.1": "2.4", "C2.2": "2.2", "C2.3": "2.5", "C2.5": "2.5",
  "C2.6": "2.3", "C2.8": "2.7", "C2.10": "2.6", "C2.12": "2.9",
};

// item id -> cluster (the sub-outcome the correct answer turns on)
const MAP = {
  "ci-sustain-1": "C2.1", "ci-sustain-2": "C2.1", "ci-sustain-3": "C2.1",
  "ci-motionless-1": "C2.1", "ci-motionless-2": "C2.1",
  "ci-netforce-1": "C2.2", "ci-netforce-2": "C2.2",
  "ci-gG-1": "C2.10", "ci-gG-2": "C2.3",
  "ci-heavier-1": "C2.3", "ci-heavier-2": "C2.3",
  "ci-third-same-1": "C2.6", "ci-third-same-2": "C2.6",
  "ci-third-balanced-1": "C2.6", "ci-third-balanced-2": "C2.6",
  "ci-third-effect-1": "C2.6", "ci-third-effect-2": "C2.6",
  "ci-friction-1": "C2.8", "ci-friction-2": "C2.8",
  "ci-normal-1": "C2.5",
  "ci-centripetal-1": "C2.12", "ci-centripetal-2": "C2.12",
  "ci-push-against-1": "C2.6",
  "ci-anchor-1": "C2.1", "ci-anchor-2": "C2.3", "ci-anchor-3": "C2.3", "ci-anchor-4": "C2.1",
};

const file = path.join(ROOT, "content/ap-physics-1/unit-2-dynamics/unit-2-concept-check.json");
const lines = fs.readFileSync(file, "utf8").split("\n");
const out = [];
let curId = null;
let added = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const idm = line.match(/^\s*"id":\s*"(ci-[^"]+)"/);
  if (idm) curId = idm[1];
  out.push(line);

  const pm = line.match(/^(\s*)"pairId":\s*[^,]+,\s*$/);
  if (pm && curId && MAP[curId] && !/^\s*"objective":/.test(lines[i + 1] || "")) {
    const cluster = MAP[curId];
    const ind = pm[1];
    out.push(`${ind}"objective": "${cluster}",`);
    out.push(`${ind}"cedTopic": "${CED[cluster]}",`);
    out.push(`${ind}"clusterId": "${cluster.slice(1)}",`);
    added++;
  }
}

fs.writeFileSync(file, out.join("\n"), "utf8");
JSON.parse(fs.readFileSync(file, "utf8")); // fail loudly if malformed
console.log(`unit-2-concept-check.json: tags added to ${added} item(s)`);
