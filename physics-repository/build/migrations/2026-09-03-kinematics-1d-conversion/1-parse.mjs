import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
// repo root = three levels up from build/migrations/<this dir>/
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SRC = ROOT + "resources/physics8/rescue_sprint/unit_02_kinematics/test_bank";
const PARSED_OUT = new URL("./u2-parsed.json", import.meta.url);

// --- LaTeX / text normalisation -------------------------------------------------
function tex(s) {
  if (s == null) return s;
  return s
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$")   // \( \)  -> $ $
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$") // \[ \]  -> $$ $$
    .replace(/\\degree/g, "^\\circ")               // \degree -> ^\circ  (always inside math)
    .replace(/[ \t]+$/gm, "")
    .trim();
}

const LETTERS = ["A", "B", "C", "D", "E"];

function splitItems(md, kind) {
  // kind: 'mcq' | 'frq'
  const re = kind === "mcq" ? /^### (U2-MCQ-\d+)\s*$/m : /^### (U2-FRQ-\d+)\s*$/m;
  const parts = md.split(/^### (U2-(?:MCQ|FRQ)-\d+)\s*$/m);
  // parts[0] is preamble; then alternating id, body
  const items = [];
  for (let i = 1; i < parts.length; i += 2) {
    items.push({ id: parts[i].trim(), body: parts[i + 1] });
  }
  return items;
}

function meta(body, key) {
  const m = body.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.+)`));
  return m ? m[1].trim() : null;
}

function parseMcq(id, body, clusterFile) {
  const outcome = (meta(body, "Outcomes?") || "").split(/,\s*/).filter(Boolean);
  const difficulty = meta(body, "Difficulty");
  const misc = meta(body, "Misconception");
  let asset = meta(body, "Asset");
  if (asset && /^none$/i.test(asset)) asset = null;
  if (asset) asset = asset.replace(/`/g, "").replace(/^\.\.\//, "").trim();
  const answer = (meta(body, "Answer") || "").trim();

  // everything after the **Answer:** line, up to **Rationale**
  const afterAnswer = body.split(/\*\*Answer:\*\*.*\n/)[1] || "";
  const [stemBlock, rationaleBlock] = afterAnswer.split(/\*\*Rationale\*\*/);
  // options: lines like "A. ..." possibly multi-line until next letter or blank
  const lines = stemBlock.split("\n");
  const optIdx = lines.findIndex((l) => /^[A-E]\.\s/.test(l.trim()));
  const stem = lines.slice(0, optIdx).join("\n").trim();
  const optLines = lines.slice(optIdx).join("\n").trim();
  const choices = [];
  const optRe = /^([A-E])\.\s+([\s\S]*?)(?=\n[A-E]\.\s|\n*$)/gm;
  let mm;
  while ((mm = optRe.exec(optLines))) choices.push({ letter: mm[1], text: mm[2].replace(/\s+/g, " ").trim() });

  // rationale bullets: "- A: ..." / "- Correct (C): ..."
  const rats = {};
  let correctText = null;
  const ratRe = /^-\s+(?:\*\*)?(?:Correct\s*\(([A-E])\)|([A-E]))(?:\*\*)?\s*:\s*([\s\S]*?)(?=\n-\s|\n---|\n*$)/gm;
  let r;
  while ((r = ratRe.exec(rationaleBlock || ""))) {
    const L = r[1] || r[2];
    const t = r[3].replace(/\s+/g, " ").trim();
    if (r[1]) correctText = t;
    rats[L] = t;
  }

  return {
    id, kind: "mcq", clusterFile, outcome, difficulty, misconception: misc,
    asset, answer, stem: tex(stem),
    choices: choices.map((c) => ({ letter: c.letter, text: tex(c.text) })),
    rationales: Object.fromEntries(Object.entries(rats).map(([k, v]) => [k, tex(v)])),
    correctText: tex(correctText),
  };
}

function parseFrq(id, body, clusterFile) {
  const outcome = (meta(body, "Outcomes?") || "").split(/,\s*/).filter(Boolean);
  const difficulty = meta(body, "Difficulty");
  const points = parseInt(meta(body, "Points") || "0", 10);
  let asset = meta(body, "Asset");
  if (asset && /^none$/i.test(asset)) asset = null;
  if (asset) {
    const am = asset.match(/`\.\.\/([^`]+)`/) || asset.match(/([\w./-]+\.svg)/);
    asset = am ? am[1].replace(/^\.\.\//, "") : null;
  }
  const [scenAndParts, rubricBlock] = body.split(/\*\*Scoring rubric\*\*/);
  // scenario = text after the meta lines, before first **(a)**
  const sp = scenAndParts.split(/\n(?=\*\*\([a-z]\)\*\*)/);
  let scenario = sp[0]
    .replace(/\*\*Outcomes?:\*\*.*\n/g, "")
    .replace(/\*\*Difficulty:\*\*.*\n/g, "")
    .replace(/\*\*Points:\*\*.*\n/g, "")
    .replace(/\*\*Asset:\*\*.*\n/g, "")
    .replace(/\*\[Diagram:[\s\S]*?\]\*/g, "")
    .trim();

  const partRe = /\*\*\(([a-z])\)\*\*\s*([\s\S]*?)(?:\*\((\d+)\s*points?\)\*)?\s*(?=\n\*\*\([a-z]\)\*\*|\n---|\n*$)/g;
  const parts = [];
  let p;
  while ((p = partRe.exec(sp.slice(1).join("\n")))) {
    parts.push({ label: p[1], prompt: tex(p[2].replace(/\s+/g, " ").trim()), points: p[3] ? parseInt(p[3], 10) : null });
  }
  // rubric per part
  const rubric = {};
  if (rubricBlock) {
    const rubRe = /\*\*\(([a-z])\)\s*[—-]\s*(\d+)\s*points?\*\*\s*([\s\S]*?)(?=\n\*\*\([a-z]\)\s*[—-]|\n---|\n*$)/g;
    let rb;
    while ((rb = rubRe.exec(rubricBlock))) {
      rubric[rb[1]] = { points: parseInt(rb[2], 10), body: rb[3].trim() };
    }
  }
  for (const pt of parts) {
    const rb = rubric[pt.label];
    if (rb) {
      if (pt.points == null) pt.points = rb.points;
      pt.modelResponse = tex(
        rb.body
          .split("\n")
          .map((l) => l.replace(/^\s*-\s*/, "").trim())
          .filter(Boolean)
          .join(" ")
      );
    }
  }
  return {
    id, kind: "frq", clusterFile, outcome, difficulty,
    points: points || parts.reduce((s, x) => s + (x.points || 0), 0),
    asset, scenario: tex(scenario), parts,
  };
}

const out = { mcq: [], frq: [] };
for (const f of fs.readdirSync(path.join(SRC, "mcq"))) {
  const md = fs.readFileSync(path.join(SRC, "mcq", f), "utf8");
  for (const it of splitItems(md, "mcq")) out.mcq.push(parseMcq(it.id, it.body, f));
}
for (const f of fs.readdirSync(path.join(SRC, "frq"))) {
  const md = fs.readFileSync(path.join(SRC, "frq", f), "utf8");
  for (const it of splitItems(md, "frq")) out.frq.push(parseFrq(it.id, it.body, f));
}

// sanity report
let bad = 0;
for (const q of out.mcq) {
  const key = LETTERS.indexOf(q.answer);
  const missRat = q.choices.filter((c) => !q.rationales[c.letter]).map((c) => c.letter);
  if (q.choices.length < 3 || key < 0 || key >= q.choices.length || !q.correctText || missRat.length) {
    bad++;
    if (bad <= 12) console.log("MCQ ISSUE", q.id, "choices", q.choices.length, "ans", q.answer, "missRat", missRat, "corr?", !!q.correctText);
  }
}
let fbad = 0;
for (const q of out.frq) {
  const psum = q.parts.reduce((s, x) => s + (x.points || 0), 0);
  const missModel = q.parts.filter((x) => !x.modelResponse).map((x) => x.label);
  if (!q.parts.length || missModel.length || psum !== q.points) {
    fbad++;
    if (fbad <= 12) console.log("FRQ ISSUE", q.id, "parts", q.parts.length, "psum", psum, "pts", q.points, "missModel", missModel);
  }
}
console.log(`\nMCQ parsed ${out.mcq.length}, issues ${bad}`);
console.log(`FRQ parsed ${out.frq.length}, issues ${fbad}`);
// difficulty tallies
const tally = (arr) => arr.reduce((m, q) => ((m[q.difficulty] = (m[q.difficulty] || 0) + 1), m), {});
console.log("MCQ difficulty", tally(out.mcq));
console.log("FRQ difficulty", tally(out.frq));
const assets = new Set([...out.mcq, ...out.frq].filter((q) => q.asset).map((q) => q.asset));
console.log("distinct assets", [...assets]);

fs.writeFileSync(PARSED_OUT, JSON.stringify(out, null, 2));
console.log("wrote u2-parsed.json");
