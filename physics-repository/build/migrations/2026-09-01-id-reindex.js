#!/usr/bin/env node
/**
 * One-shot structural migration (architecture §9.2 / §12.6).
 *
 * Promotes the seed question-bank items from their lesson-scoped
 * "further practice" ids to the unit test-bank identifier scheme, and
 * adds a `clusterId` field (the bare cluster number) so the bank can be
 * filtered by cluster without parsing `objective`:
 *
 *   ap1-u2-dynamics.json      ap1-u2-l3-fpNN  -> AP1-U2-MCQ-0NN   (001–050)
 *   ap1-u2-forces-fbd.json    ap1-u2-l1-fpNN  -> AP1-U2-MCQ-05N   (051–058)
 *   ap1-u2-dynamics-frq.json  ap1-u2-frq-NN   -> AP1-U2-FRQ-0NN   (001–015)
 *
 * `furtherPracticeQuestionIds` in the two lessons that reference these
 * items are rewritten to match. Lesson-embedded formative checks keep
 * their lesson-scoped ids (§9.2) but also gain `clusterId`.
 *
 * `clusterId` = `objective` with the "C" removed (objective "C2.7" ->
 * clusterId "2.7"); it can differ from `cedTopic`.
 *
 * Idempotent. Run from physics-repository/:
 *   node build/migrations/2026-09-01-id-reindex.js
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../render/paths.js";

const pad3 = (n) => String(n).padStart(3, "0");

// id transforms, per file basename
const ID_RULES = {
  "ap1-u2-dynamics.json": (id) => {
    const m = /^ap1-u2-l3-fp(\d+)$/.exec(id);
    return m ? `AP1-U2-MCQ-${pad3(+m[1])}` : null;
  },
  "ap1-u2-forces-fbd.json": (id) => {
    const m = /^ap1-u2-l1-fp(\d+)$/.exec(id);
    return m ? `AP1-U2-MCQ-${pad3(+m[1] + 50)}` : null;
  },
  "ap1-u2-dynamics-frq.json": (id) => {
    const m = /^ap1-u2-frq-(\d+)$/.exec(id);
    return m ? `AP1-U2-FRQ-${pad3(+m[1])}` : null;
  },
};

const BANK = "data/question-bank";
const idMap = {}; // old -> new, for the lesson reference rewrite

// ---- pass 1: bank files (ids + clusterId) ----
for (const [base, rule] of Object.entries(ID_RULES)) {
  const abs = path.join(ROOT, BANK, base);
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  const out = [];
  let curObjective = null;
  let ids = 0;
  let clusters = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const om = line.match(/^\s*"objective":\s*"(C?2\.\d+)"/);
    if (om) curObjective = om[1];

    const im = line.match(/^(\s*)"id":\s*"([^"]+)"(,?)\s*$/);
    if (im) {
      const [, ind, oldId, comma] = im;
      const newId = rule(oldId);
      if (newId && newId !== oldId) {
        idMap[oldId] = newId;
        out.push(`${ind}"id": "${newId}"${comma || ","}`);
        ids++;
        continue;
      }
    }

    const cm = line.match(/^(\s*)"cedTopic":\s*"(2\.\d+)"(,?)\s*$/);
    if (cm) {
      out.push(line);
      const nextIsCluster = /^\s*"clusterId":/.test(lines[i + 1] || "");
      if (!nextIsCluster && curObjective) {
        out.push(`${cm[1]}"clusterId": "${curObjective.replace(/^C/, "")}"${cm[3] || ","}`);
        clusters++;
      }
      continue;
    }

    out.push(line);
  }

  fs.writeFileSync(abs, out.join("\n"), "utf8");
  console.log(`${BANK}/${base}: ${ids} id(s) re-indexed, ${clusters} clusterId(s) added`);
}

// ---- pass 2: rewrite references + add clusterId in lesson content ----
const LESSONS = [
  "content/ap-physics-1/unit-2-dynamics/newtons-second-law.json",
  "content/ap-physics-1/unit-2-dynamics/forces-and-free-body-diagrams.json",
];
for (const rel of LESSONS) {
  const abs = path.join(ROOT, rel);
  let text = fs.readFileSync(abs, "utf8");

  // rewrite every further-practice reference token, however the array is
  // wrapped (one- or many-per-line). Embedded formative-check ids are
  // "...-q01"/"...-mc01" etc., never "...-fpNN", so this is unambiguous.
  // resolve a reference token with the same rules as pass 1, so this
  // works even on a re-run where pass 1 already migrated the bank files.
  const resolve = (id) =>
    id.startsWith("ap1-u2-l1-fp")
      ? ID_RULES["ap1-u2-forces-fbd.json"](id)
      : ID_RULES["ap1-u2-dynamics.json"](id);
  let refs = 0;
  text = text.replace(/"(ap1-u2-(?:l1|l3)-fp\d+)"/g, (whole, id) => {
    const next = resolve(id);
    if (next) { refs++; return `"${next}"`; }
    return whole;
  });

  // add clusterId after each cedTopic line (line walk, tracking objective)
  const lines = text.split("\n");
  const out = [];
  let curObjective = null;
  let clusters = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const om = line.match(/^\s*"objective":\s*"(C?2\.\d+)"/);
    if (om) curObjective = om[1];
    out.push(line);
    const cm = line.match(/^(\s*)"cedTopic":\s*"(2\.\d+)"(,?)\s*$/);
    if (cm && !/^\s*"clusterId":/.test(lines[i + 1] || "") && curObjective) {
      out.push(`${cm[1]}"clusterId": "${curObjective.replace(/^C/, "")}"${cm[3] || ","}`);
      clusters++;
    }
  }

  fs.writeFileSync(abs, out.join("\n"), "utf8");
  console.log(`${rel}: ${refs} reference(s) rewritten, ${clusters} clusterId(s) added`);
}

console.log(`\n${Object.keys(idMap).length} item ids remapped.`);
