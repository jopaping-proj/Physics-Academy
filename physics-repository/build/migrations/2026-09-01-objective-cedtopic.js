#!/usr/bin/env node
/**
 * One-shot structural migration (architecture §12.15 / §13.1).
 *
 * Re-tags every `objective` from the bare CED-colliding form "2.N" to the
 * C-prefixed cluster form "C2.N" (architecture §2), and inserts a
 * `cedTopic` field (the real CED topic number) on the next line.
 *
 * Cluster -> CED topic map is the §2 table. C2.10 spans CED 2.6 + 2.8 +
 * (apparent weight) 2.5, so those items are refined per-item by id.
 *
 * Idempotent: an `objective` that is already "C…"-prefixed, or already
 * followed by a `cedTopic` line, is left alone. Formatting is preserved —
 * this is line-level regex surgery, not a JSON round-trip.
 *
 * Run from physics-repository/:  node build/migrations/2026-09-01-objective-cedtopic.js
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../render/paths.js";

const CED_BY_CLUSTER = {
  "C2.1": "2.4",
  "C2.2": "2.2",
  "C2.3": "2.5",
  "C2.4": "2.5",
  "C2.5": "2.5",
  "C2.6": "2.3",
  "C2.7": "2.5",
  "C2.8": "2.7",
  "C2.9": "2.5",
  "C2.10": "2.6", // default; refined per-item below (springs -> 2.8, apparent weight -> 2.5)
  "C2.11": "2.1",
  "C2.12": "2.9",
};

// C2.10 items that are not gravitation: springs -> 2.8, apparent weight -> 2.5
const C210_OVERRIDE = {
  "ap1-u2-l3-fp20": "2.8",
  "ap1-u2-l3-fp21": "2.8",
  "ap1-u2-l3-fp50": "2.8",
  "ap1-u2-l3-fp22": "2.5",
  "ap1-u2-l3-fp23": "2.5",
  "ap1-u2-frq-13": "2.8",
  "ap1-u2-frq-09": "2.5",
};

const FILES = [
  "data/question-bank/ap1-u2-dynamics.json",
  "data/question-bank/ap1-u2-dynamics-frq.json",
  "data/question-bank/ap1-u2-forces-fbd.json",
  "content/ap-physics-1/unit-2-dynamics/newtons-second-law.json",
  "content/ap-physics-1/unit-2-dynamics/forces-and-free-body-diagrams.json",
];

const OBJ_RE = /^(\s*)"objective":\s*"(C?2\.\d+)"(,?)\s*$/;
const ID_RE = /^\s*"id":\s*"([^"]+)"/;

let totalChanged = 0;
const report = [];

for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  const out = [];
  let currentId = null;
  let fileChanged = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idm = line.match(ID_RE);
    if (idm) currentId = idm[1];

    const m = line.match(OBJ_RE);
    if (!m) { out.push(line); continue; }

    const [, indent, value, comma] = m;
    const alreadyPrefixed = value.startsWith("C");
    const nextIsCed = /^\s*"cedTopic":/.test(lines[i + 1] || "");

    const cluster = alreadyPrefixed ? value : "C" + value.slice(0); // "2.N" -> "C2.N"
    let ced = CED_BY_CLUSTER[cluster];
    if (cluster === "C2.10" && currentId && C210_OVERRIDE[currentId]) {
      ced = C210_OVERRIDE[currentId];
    }

    if (alreadyPrefixed && nextIsCed) { out.push(line); continue; } // fully migrated

    out.push(`${indent}"objective": "${cluster}"${comma || ","}`);
    if (!nextIsCed) {
      out.push(`${indent}"cedTopic": "${ced}"${comma || ","}`);
    }
    fileChanged++;
    report.push(`  ${rel.split("/").pop()}  ${currentId || "(top-level/other)"}  ${value} -> ${cluster} / cedTopic ${ced}`);
  }

  if (fileChanged) {
    fs.writeFileSync(abs, out.join("\n"), "utf8");
    totalChanged += fileChanged;
  }
  console.log(`${rel}: ${fileChanged} objective(s) re-tagged`);
}

console.log(`\n${totalChanged} items migrated:\n${report.join("\n")}`);
