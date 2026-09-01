/**
 * Build-time content validator (architecture §9.7 + §10.4).
 *
 * Enforces the mechanical half of the item-review protocol so a
 * malformed or drifting item fails the build instead of shipping:
 *
 *   - controlled-vocabulary drift: every `skill`, `representation`,
 *     `difficulty`, `courses`, `cognitiveLevel` value must be defined in
 *     data/taxonomies.json (never invented inline);
 *   - `courses` present and non-empty on every bank item and lesson;
 *   - `objective` in the C-prefixed cluster form (`C2.x`) with a
 *     `cedTopic` naming a real CED topic (the §12.15 migration target);
 *   - multiple-choice: ≥2 choices, in-range answer key, and a
 *     `feedback.incorrect` entry for every distractor (review check 3);
 *   - free-response: parts with prompts + a model response or a figure,
 *     and `totalPoints` consistent with the per-part points;
 *   - concept-inventory: qualitative only — no answer option may be a
 *     bare numeric/unit value — and every item carries a `misconception`.
 *
 * Errors fail the build; warnings are printed and allowed.
 *
 * Usage:  import { validateContent } from "./validate.js"
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, CONTENT_DIR } from "./render/paths.js";

const BANK_DIR = path.join(ROOT, "data", "question-bank");
const VALID_CED_TOPICS = new Set(["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9"]);

function walkJsonFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkJsonFiles(full));
    else if (e.isFile() && e.name.endsWith(".json")) out.push(full);
  }
  return out;
}

// a bare number, optionally signed / decimal / with a common unit — the
// kind of option the concept inventory forbids (§10.2 rule 1).
const NUMERIC_OPTION = /^\s*[-+]?\$?\d[\d.,\s]*\s*(N|kg|m|s|J|W|Hz|N\/m|m\/s\^?2?|m\/s|°|degrees?)?\s*\$?\s*$/i;

export function validateContent({ taxonomies }) {
  const errors = [];
  const warnings = [];
  const skills = new Set(taxonomies.skill.values);
  const reps = new Set(taxonomies.representation.values);
  const diffs = new Set(taxonomies.difficulty.values);
  const courses = new Set(taxonomies.courses.values);
  const cogLevels = new Set(taxonomies.cognitiveLevel.values.map((v) => v.level));

  const rel = (f) => path.relative(ROOT, f);

  function checkCourses(where, obj) {
    if (!Array.isArray(obj.courses) || obj.courses.length === 0) {
      errors.push(`${where}: missing or empty "courses" array`);
      return;
    }
    for (const c of obj.courses) {
      if (!courses.has(c)) errors.push(`${where}: unknown course "${c}" (not in taxonomies.json)`);
    }
  }

  function checkObjective(where, obj) {
    if (obj.objective == null) return; // objective is optional on some items
    if (!/^C2\.\d+$/.test(obj.objective)) {
      errors.push(`${where}: objective "${obj.objective}" is not in the C-prefixed cluster form (expected e.g. "C2.5")`);
    }
    if (obj.cedTopic == null) {
      errors.push(`${where}: has "objective" but no "cedTopic" (§12.15 migration)`);
    } else if (!VALID_CED_TOPICS.has(obj.cedTopic)) {
      errors.push(`${where}: cedTopic "${obj.cedTopic}" is not a real AP Physics 1 Unit 2 CED topic (2.1–2.9)`);
    }
  }

  function checkVocab(where, obj) {
    if (obj.skill != null && !skills.has(obj.skill))
      errors.push(`${where}: skill "${obj.skill}" not in taxonomies.json`);
    if (obj.representation != null && !reps.has(obj.representation))
      errors.push(`${where}: representation "${obj.representation}" not in taxonomies.json`);
    if (obj.difficulty != null && !diffs.has(obj.difficulty))
      errors.push(`${where}: difficulty "${obj.difficulty}" not in taxonomies.json`);
    if (obj.cognitiveLevel != null && !cogLevels.has(obj.cognitiveLevel))
      errors.push(`${where}: cognitiveLevel ${obj.cognitiveLevel} outside the 1–8 scale`);
  }

  function checkMultipleChoice(where, q) {
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      errors.push(`${where}: multiple-choice needs at least 2 choices`);
      return;
    }
    const key = q.correctAnswer != null ? q.correctAnswer : q.correctIndex;
    if (typeof key !== "number" || key < 0 || key >= q.choices.length) {
      errors.push(`${where}: correctAnswer/correctIndex ${key} out of range`);
    }
    if (q.feedback) {
      if (!q.feedback.correct) warnings.push(`${where}: no feedback.correct`);
      const incorrect = q.feedback.incorrect || {};
      for (let i = 0; i < q.choices.length; i++) {
        if (i === key) continue;
        if (incorrect[i] == null && incorrect[String(i)] == null)
          errors.push(`${where}: distractor #${i} has no feedback.incorrect entry (review check 3)`);
      }
    } else {
      warnings.push(`${where}: no feedback block`);
    }
  }

  function checkFreeResponse(where, q) {
    if (!Array.isArray(q.parts) || q.parts.length === 0) {
      errors.push(`${where}: free-response needs a "parts" array`);
      return;
    }
    let sum = 0;
    let haveAllPoints = true;
    q.parts.forEach((p, i) => {
      if (!p.prompt) errors.push(`${where} part ${p.label || i}: no prompt`);
      if (!p.modelResponse && !p.figure && !p.figures)
        errors.push(`${where} part ${p.label || i}: no modelResponse and no figure`);
      if (typeof p.points === "number") sum += p.points;
      else haveAllPoints = false;
    });
    if (haveAllPoints && typeof q.totalPoints === "number" && q.totalPoints !== sum)
      errors.push(`${where}: totalPoints ${q.totalPoints} ≠ sum of part points ${sum}`);
  }

  function checkItem(where, q, { requireCourses = true } = {}) {
    if (requireCourses) checkCourses(where, q);
    checkObjective(where, q);
    checkVocab(where, q);
    const type = q.type || (Array.isArray(q.parts) ? "free-response" : "multiple-choice");
    if (type === "multiple-choice") checkMultipleChoice(where, q);
    else if (type === "free-response") checkFreeResponse(where, q);
  }

  // ---- question-bank files ----
  for (const f of walkJsonFiles(BANK_DIR)) {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, "utf8")); }
    catch (e) { errors.push(`${rel(f)}: invalid JSON — ${e.message}`); continue; }
    const items = Array.isArray(data) ? data : data.items || data.questions || [];
    items.forEach((q) => checkItem(`${rel(f)} [${q.id || "?"}]`, q));
  }

  // ---- lesson content files ----
  for (const f of walkJsonFiles(CONTENT_DIR)) {
    let lesson;
    try { lesson = JSON.parse(fs.readFileSync(f, "utf8")); }
    catch (e) { errors.push(`${rel(f)}: invalid JSON — ${e.message}`); continue; }
    const where = rel(f);

    if (lesson.format === "concept-inventory") {
      checkCourses(where, lesson);
      (lesson.items || []).forEach((it, i) => {
        const w = `${where} [${it.id || i}]`;
        if (!it.misconception) errors.push(`${w}: concept-inventory item has no "misconception" tag (§10.4)`);
        if (!Array.isArray(it.choices) || it.choices.length < 2) {
          errors.push(`${w}: needs at least 2 choices`);
        } else {
          if (typeof it.correct !== "number" || it.correct < 0 || it.correct >= it.choices.length)
            errors.push(`${w}: "correct" index out of range`);
          it.choices.forEach((c, ci) => {
            if (NUMERIC_OPTION.test(String(c)))
              errors.push(`${w}: choice #${ci} looks numeric ("${c}") — the concept inventory is qualitative only (§10.2)`);
          });
        }
      });
      continue;
    }

    // regular lesson deck
    checkCourses(where, lesson);
    checkObjective(where, lesson);

    const embedded = [];
    (lesson.chunks || []).forEach((ch) => ch.formativeCheck && embedded.push(ch.formativeCheck));
    (lesson.misconceptions || []).forEach((m) => embedded.push(m));
    (lesson.lessonAssessment || []).forEach((q) => embedded.push(q));
    if (lesson.exitQuestion) embedded.push(lesson.exitQuestion);
    embedded.forEach((q) => checkItem(`${where} [${q.id || "?"}]`, q));
  }

  return { errors, warnings };
}
