/**
 * Unit-test assembler (docs/test-generation.md).
 *
 * A content file with `"format": "unit-test"` is not a slide deck: it is a
 * timed, randomly-generated practice test. This module turns that file plus
 * its referenced question banks into the JSON payload embedded in the page.
 * The actual draw (which items, in what order, options shuffled) happens
 * at ATTEMPT time in js/unit-test.js so every sitting is different — this
 * module only assembles the candidate pool and checks it against
 * data/test-blueprint.json.
 */
import fs from "node:fs";
import path from "node:path";
import { QUESTION_BANK_DIR, DATA_DIR } from "./paths.js";
import { renderFigures } from "./primitives.js";
import { mdToHtml } from "../../js/markdown.js";

const DIFFICULTY_ORDER = ["foundation", "developing", "ap-ib-standard", "ap5-ib7-target", "distinction-stretch"];

export function loadBlueprint() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "test-blueprint.json"), "utf8"));
}

function loadBank(file) {
  const p = path.join(QUESTION_BANK_DIR, file);
  if (!fs.existsSync(p)) {
    console.warn(`[build] WARNING: unit-test bank not found: ${file}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Inline any authored figures / table scenarios exactly as renderFormativeCheck does,
// so js/unit-test.js (which cannot read the filesystem) gets ready HTML.
function prepMcq(q) {
  const figs = q.figures || (q.figure ? [q.figure] : null);
  return {
    id: q.id,
    question: q.question,
    choices: q.choices,
    correctAnswer: q.correctAnswer,
    feedback: q.feedback || null,
    hint: q.hint || null,
    solution: q.solution || null,
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitiveLevel,
    calculatorFree: q.calculatorFree === true,
    figureHtml: figs ? renderFigures(figs) : "",
  };
}

function prepFrq(q) {
  const figs = q.figures || (q.figure ? [q.figure] : null);
  const scenario = q.scenario || q.question || "";
  const hasTable = typeof scenario === "string" && /(^|\n)\s*\|.*\|/.test(scenario);
  return {
    id: q.id,
    scenario,
    scenarioHtml: hasTable ? mdToHtml(scenario) : "",
    parts: (q.parts || []).map((p) => ({ label: p.label, prompt: p.prompt, points: p.points, modelResponse: p.modelResponse })),
    totalPoints: q.totalPoints || (q.parts || []).reduce((s, p) => s + (p.points || 0), 0),
    scoringNotes: q.scoringNotes || "",
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitiveLevel,
    figureHtml: figs ? renderFigures(figs) : "",
  };
}

function bucketCounts(items) {
  const out = {};
  for (const d of DIFFICULTY_ORDER) out[d] = 0;
  for (const it of items) if (out[it.difficulty] != null) out[it.difficulty]++;
  return out;
}

/**
 * @returns {{ payload: object, warnings: string[] }}
 */
export function assembleUnitTest(lesson, blueprint) {
  const warnings = [];
  const courseId = (lesson.courses && lesson.courses[0]) || "ap-physics-1";
  const calcPolicy =
    lesson.calculatorPolicy ||
    (blueprint.calculatorPolicyByCourse && blueprint.calculatorPolicyByCourse[courseId]) ||
    "allowed";

  const mcqBanks = lesson.mcqBanks || [];
  const frqBanks = lesson.frqBanks || [];
  let mcqPool = mcqBanks.flatMap(loadBank).filter((q) => q.type === "multiple-choice").map(prepMcq);
  const frqPool = frqBanks.flatMap(loadBank).filter((q) => q.type === "free-response").map(prepFrq);

  if (calcPolicy === "not-allowed") {
    const before = mcqPool.length;
    mcqPool = mcqPool.filter((q) => q.calculatorFree);
    if (mcqPool.length < before) {
      warnings.push(
        `calculatorPolicy "not-allowed": MCQ pool filtered to ${mcqPool.length} calculator-free of ${before} (items need "calculatorFree": true).`
      );
    }
  }

  // de-dupe by id (a bank item can be reused across lessons)
  const seen = new Set();
  mcqPool = mcqPool.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));

  // pool-adequacy check against the blueprint difficulty distribution
  const dist = blueprint.difficultyDistribution || {};
  const tol = (blueprint.toleranceOnDistribution && blueprint.toleranceOnDistribution.perBucketAbsolute) || 0.12;
  const counts = bucketCounts(mcqPool);
  for (const d of DIFFICULTY_ORDER) {
    const target = dist[d];
    if (typeof target !== "number") continue;
    const have = counts[d] / (mcqPool.length || 1);
    if (mcqPool.length >= 10 && have + tol < target) {
      warnings.push(
        `MCQ pool is thin at "${d}": ${counts[d]}/${mcqPool.length} (${(have * 100).toFixed(0)}%) vs blueprint target ${(target * 100).toFixed(0)}%.`
      );
    }
  }
  if (mcqPool.length < 12) warnings.push(`MCQ pool has only ${mcqPool.length} items — a 45-minute test wants ~15+.`);

  const payload = {
    key: lesson.id,
    title: lesson.lessonTitle || "Unit Test",
    course: lesson.course || "",
    unit: lesson.unit || "",
    calculatorPolicy: calcPolicy,
    config: lesson.config || { mode: "time", minutes: blueprint.unitTest.timeLimitMinutes },
    blueprint: {
      pointSplit: blueprint.pointSplit,
      difficultyDistribution: blueprint.difficultyDistribution,
      cognitiveDistribution: blueprint.cognitiveDistribution,
      timing: blueprint.timing,
      unitTest: blueprint.unitTest,
      toleranceOnDistribution: blueprint.toleranceOnDistribution,
    },
    mcqPool,
    frqPool,
  };
  return { payload, warnings };
}
