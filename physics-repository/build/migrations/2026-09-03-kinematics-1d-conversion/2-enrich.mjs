import fs from "node:fs";

const d = JSON.parse(fs.readFileSync(new URL("./u2-parsed.json", import.meta.url)));
const LETTERS = ["A", "B", "C", "D", "E"];
import { fileURLToPath } from "node:url";
const OUT_DIR = fileURLToPath(new URL("../../../data/question-bank/", import.meta.url));

const clusterKey = (f) => f.replace(/^(mcq|frq)_\d+_/, "").replace(/\.md$/, "");
// Capitalise the first visible letter, but never a letter that begins a LaTeX
// command (preceded by "\") or that sits inside a leading math span.
function cap(s) {
  if (!s) return s;
  s = s.replace(/^Correct\s*\([A-E]\):\s*/i, "").trim();
  // only touch a string that genuinely opens with a lowercase word of >=2 letters;
  // leave math ($...), LaTeX commands (\cos), numbers/signs (0 m, +7.0, -10) alone.
  const m = s.match(/^([a-z])([a-z].*)$/s);
  return m ? m[1].toUpperCase() + m[2] : s;
}

const NICE_ANGLES = ["0", "30", "36.9", "37", "45", "53", "53.1", "60", "90"];
function needsCalc(q) {
  const blob = [q.stem, q.scenario, q.correctText, ...(q.choices || []).map((c) => c.text || c),
    ...Object.values(q.rationales || {}), ...((q.parts || []).map((p) => p.modelResponse))].join(" ");
  // non-perfect-square numeric roots
  for (const mm of blob.matchAll(/\\sqrt\{?\(?\s*(\d+)\s*\)?\}?/g)) {
    const n = +mm[1];
    if (n > 0 && !Number.isInteger(Math.sqrt(n))) return true;
  }
  // \sqrt{a^2 + b^2}
  for (const mm of blob.matchAll(/\\sqrt\{?\(?\s*\(?-?(\d+)\)?\^2\s*\+\s*\(?-?(\d+)\)?\^2/g)) {
    const s = Number(mm[1]) ** 2 + Number(mm[2]) ** 2;
    if (!Number.isInteger(Math.sqrt(s))) return true;
  }
  // inverse trig whose stated result is not a recognised clean angle
  if (/(tan|sin|cos)\^\{-1\}|\\arctan|\\arcsin|\\arccos/.test(blob)) {
    const angles = [...blob.matchAll(/(?:\\approx|=)\s*(-?\d+(?:\.\d+)?)\s*\^?\\?circ/g)].map((x) => x[1]);
    if (!angles.length || angles.some((a) => !NICE_ANGLES.includes(a))) return true;
  }
  // forward trig of a non-convention angle (e.g. \sin 25^\circ) — not hand-evaluable
  for (const mm of blob.matchAll(/\\(?:sin|cos|tan)\s*\(?\s*(\d+(?:\.\d+)?)\s*\^?\\?circ/g)) {
    if (!["30", "37", "45", "53", "60"].includes(mm[1])) return true;
  }
  return false;
}
const CONV = "Take $\\sin 37^\\circ = \\cos 53^\\circ = 0.60$ and $\\cos 37^\\circ = \\sin 53^\\circ = 0.80$. ";
const isArg = (t) =>
  /which statement (is|about)|what is wrong|evaluate (this|the)|explain (why|what)|a student (says|claims|argues|looks|reasons)|is this (claim|reasoning|argument)|which best explains|why (is|does|would)/i.test(t || "");

const hasMisc = (q) => q.misconception && !/^none$/i.test(q.misconception);
function mapDifficulty(q, text) {
  const arg = isArg(text);
  const cluster = clusterKey(q.clusterFile);
  if (q.difficulty === "Moderate") {
    const trivialId =
      !hasMisc(q) && !arg &&
      (/which (one|quantity|of the following|list|statement).*(vector|scalar)/i.test(q.stem) ||
        (cluster === "vector_components" && /what is the (horizontal|vertical|\$?[xy]\$?).*component/i.test(q.stem)));
    return trivialId ? "foundation" : "developing";
  }
  if (q.difficulty === "Challenging") return arg ? "ap5-ib7-target" : "ap-ib-standard";
  if (q.difficulty === "High challenge") return arg ? "distinction-stretch" : "ap5-ib7-target";
  return "ap-ib-standard";
}
function cogLevel(q, text) {
  const arg = isArg(text);
  if (q.difficulty === "Moderate") return hasMisc(q) ? 3 : 2;
  if (q.difficulty === "Challenging") return arg ? 4 : 3;
  return arg ? 5 : 4; // High challenge
}
const SKILL = {
  "motion_foundations": (arg) => (arg ? "misconception-diagnosis" : "identify-principle"),
  "position_time_graphs": (arg) => (arg ? "misconception-diagnosis" : "multi-representation-reasoning"),
  "velocity_time_graphs": (arg) => (arg ? "misconception-diagnosis" : "multi-representation-reasoning"),
  "acceleration_time_graphs": (arg) => (arg ? "misconception-diagnosis" : "multi-representation-reasoning"),
  "equations": () => "construct-model",
  "free_fall": (arg) => (arg ? "evaluate-assumptions" : "construct-model"),
  "vector_components": () => "proportional-reasoning",
};
const REP = {
  "motion_foundations": "verbal",
  "position_time_graphs": "graph",
  "velocity_time_graphs": "graph",
  "acceleration_time_graphs": "graph",
  "equations": "equation",
  "free_fall": "numerical",
  "vector_components": "vector-diagram",
};
const HINT = {
  "motion_foundations": ["Ask whether the quantity needs a direction to be complete (vector) or just a size (scalar). For displacement use $\\Delta x = x_f - x_i$ and keep the sign; distance adds every leg's length."],
  "position_time_graphs": ["On a position\u2013time graph the height is the position and the slope is the velocity. Displacement between two times is the change in height, $\\Delta x = x_f - x_i$."],
  "velocity_time_graphs": ["On a velocity\u2013time graph the height is the velocity, the slope is the acceleration, and the area between the line and the time axis is the displacement."],
  "acceleration_time_graphs": ["On an acceleration\u2013time graph the height is the acceleration and the area under it is the change in velocity, $\\Delta v$."],
  "equations": ["List the knowns and the unknown, then choose the constant-acceleration equation that contains only those quantities."],
  "free_fall": ["Near Earth the acceleration is $9.8\\ \\mathrm{m/s^2}$ downward for the whole flight \u2014 including at the highest point, where the velocity is momentarily zero. Its sign follows your chosen positive direction."],
  "vector_components": ["Sketch the right triangle. The leg adjacent to the angle uses cosine, the opposite leg uses sine, and the magnitude rebuilds as $\\sqrt{v_x^2 + v_y^2}$."],
};
const CAPTION = {
  "u2_mcq_pt": "Position\u2013time graph for this item.",
  "u2_mcq_vt": "Velocity\u2013time graph for this item.",
  "u2_mcq_at": "Acceleration\u2013time graph for this item.",
  "u2_mcq_ff": "Motion graph for this free-fall item.",
  "u2_mcq_vec": "Vector diagram for this item.",
  "u2_frq": "Graph for this item.",
};
function captionFor(asset) {
  const base = asset.split("/").pop().replace(/\.svg$/, "");
  for (const k of Object.keys(CAPTION)) if (base.startsWith(k)) return CAPTION[k];
  return "Diagram for this item.";
}

// ---- MCQ ----
const mcqOut = [];
for (const q of d.mcq) {
  const ck = clusterKey(q.clusterFile);
  const key = LETTERS.indexOf(q.answer);
  const text = q.stem + " " + q.choices.map((c) => c.text).join(" ");
  const arg = isArg(q.stem);
  let stem = q.stem;
  if (ck === "vector_components" && /3\s*7\^\\circ|5\s*3\^\\circ|37\^\\circ|53\^\\circ/.test(stem) && !/\\sin 37/.test(stem)) {
    stem = CONV + stem;
  }
  const incorrect = {};
  q.choices.forEach((c, i) => {
    if (i === key) return;
    incorrect[String(i)] = cap(q.rationales[c.letter]) || "This option does not follow from the correct relationship.";
  });
  const item = {
    id: q.id.replace(/^U2-/, "BP8-U2-"),
    sourceId: q.id,
    courses: ["basis-physics-8"],
    topicId: "kinematics-1d",
    unit: "Unit 2: Kinematics",
    cluster: ck,
    sourceOutcomes: q.outcome,
    type: "multiple-choice",
    skill: SKILL[ck](arg),
    representation: REP[ck],
    difficulty: mapDifficulty(q, q.stem),
    cognitiveLevel: cogLevel(q, q.stem),
    calculatorFree: !needsCalc(q),
    question: stem,
    choices: q.choices.map((c) => c.text),
    correctAnswer: key,
    feedback: {
      correct: "Correct \u2014 " + cap(q.correctText),
      incorrect,
    },
    hint: HINT[ck],
    solution: cap(q.correctText),
  };
  if (q.asset) {
    const name = q.asset.split("/").pop();
    item.figures = [{ svg: `basis-physics-8/unit-2/kinematics-bank/${name}`, caption: captionFor(q.asset) }];
  }
  mcqOut.push(item);
}

// ---- FRQ ----
const frqOut = [];
for (const q of d.frq) {
  const ck = clusterKey(q.clusterFile);
  const text = q.scenario + " " + q.parts.map((p) => p.prompt).join(" ");
  const arg = isArg(text);
  const item = {
    id: q.id.replace(/^U2-/, "BP8-U2-"),
    sourceId: q.id,
    courses: ["basis-physics-8"],
    topicId: "kinematics-1d",
    unit: "Unit 2: Kinematics",
    cluster: ck,
    sourceOutcomes: q.outcome,
    type: "free-response",
    skill: ck === "vector_components" ? "proportional-reasoning" : (arg ? "evaluate-assumptions" : "construct-model"),
    representation: REP[ck],
    difficulty: mapDifficulty(q, text),
    cognitiveLevel: Math.max(4, cogLevel(q, text)),
    scenario: q.scenario,
    parts: q.parts.map((p) => ({ label: p.label, prompt: p.prompt, points: p.points, modelResponse: p.modelResponse })),
    totalPoints: q.points,
  };
  if (q.asset) {
    const name = q.asset.split("/").pop();
    item.figures = [{ svg: `basis-physics-8/unit-2/kinematics-bank/${name}`, caption: captionFor(q.asset) }];
  }
  frqOut.push(item);
}

// ---- full bank (tranche 1 text-only + tranche 2 graph/vector items) ----
// SVGs transferred + restyled into assets/diagrams/basis-physics-8/unit-2/kinematics-bank/ (2026-09-03).
const byId = (a, b) => a.id.localeCompare(b.id, "en", { numeric: true });
mcqOut.sort(byId);
frqOut.sort(byId);

const report = (arr, label) => {
  const t = (k) => arr.reduce((m, q) => ((m[q[k]] = (m[q[k]] || 0) + 1), m), {});
  console.log(`${label}: ${arr.length}  (with figure: ${arr.filter((q) => q.figures).length})`);
  console.log("  difficulty", JSON.stringify(t("difficulty")));
  console.log("  cluster", JSON.stringify(t("cluster")));
  if (label.startsWith("MCQ")) console.log("  calculatorFree", arr.filter((q) => q.calculatorFree).length, "/", arr.length);
};
report(mcqOut, "MCQ");
report(frqOut, "FRQ");

fs.writeFileSync(`${OUT_DIR}/kinematics-1d.json`, JSON.stringify(mcqOut, null, 2) + "\n");
fs.writeFileSync(`${OUT_DIR}/kinematics-1d-frq.json`, JSON.stringify(frqOut, null, 2) + "\n");
console.log("\nwrote kinematics-1d.json + kinematics-1d-frq.json");
