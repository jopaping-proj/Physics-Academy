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
 *   - `objective` in the C-prefixed cluster form (`C<unit>.<cluster>`,
 *     e.g. `C2.5`) with a `cedTopic` in the matching `<unit>.<topic>` form
 *     (e.g. `2.5`) — checked structurally (same leading unit number), not
 *     against a fixed per-unit topic list, so this applies to any unit of
 *     any course, not just AP Physics 1 Unit 2 (the §12.15 migration
 *     target). `objective` itself stays optional — a course/lesson that
 *     hasn't adopted this alignment scheme (e.g. BASIS Physics 8 today)
 *     just omits it;
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
// C<unit>.<cluster> (e.g. "C2.5") and the matching <unit>.<topic> CED form
// (e.g. "2.5") — unit-generic by design, see the file header.
const OBJECTIVE_RE = /^C(\d+)\.\d+$/;
const CED_TOPIC_RE = /^(\d+)\.\d+$/;

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
  const misconceptions = new Set(taxonomies.misconception?.values || []);

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
    const objMatch = OBJECTIVE_RE.exec(obj.objective);
    if (!objMatch) {
      errors.push(`${where}: objective "${obj.objective}" is not in the C-prefixed cluster form (expected e.g. "C2.5")`);
    }
    if (obj.cedTopic == null) {
      errors.push(`${where}: has "objective" but no "cedTopic" (§12.15 migration)`);
    } else {
      const topicMatch = CED_TOPIC_RE.exec(obj.cedTopic);
      if (!topicMatch) {
        errors.push(`${where}: cedTopic "${obj.cedTopic}" is not in the "<unit>.<topic>" CED form (expected e.g. "2.5")`);
      } else if (objMatch && topicMatch[1] !== objMatch[1]) {
        errors.push(`${where}: cedTopic "${obj.cedTopic}" is from a different unit than objective "${obj.objective}" (expected a "${objMatch[1]}.x" topic)`);
      }
    }
    // clusterId is the bare cluster number, must agree with objective (§9.2)
    const bareCluster = obj.objective.replace(/^C/, "");
    if (obj.clusterId == null) {
      errors.push(`${where}: has "objective" but no "clusterId" (§9.2 — expected "${bareCluster}")`);
    } else if (obj.clusterId !== bareCluster) {
      errors.push(`${where}: clusterId "${obj.clusterId}" disagrees with objective "${obj.objective}"`);
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
        else if (misconceptions.size && !misconceptions.has(it.misconception))
          warnings.push(`${w}: misconception "${it.misconception}" not in taxonomies.json (add it there)`);
        checkObjective(w, it);
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

    if (lesson.format === "unit-index") {
      checkCourses(where, lesson);
      continue;
    }

    // regular lesson deck
    checkCourses(where, lesson);
    checkObjective(where, lesson);
    if (lesson.lessonNumber == null || lesson.lessonNumber === "")
      errors.push(`${where}: lesson deck has no "lessonNumber" (its place in the unit's teaching order)`);

    const embedded = [];
    (lesson.chunks || []).forEach((ch) => ch.formativeCheck && embedded.push(ch.formativeCheck));
    (lesson.misconceptions || []).forEach((m) => embedded.push(m));
    (lesson.lessonAssessment || []).forEach((q) => embedded.push(q));
    if (lesson.exitQuestion) embedded.push(lesson.exitQuestion);
    embedded.forEach((q) => checkItem(`${where} [${q.id || "?"}]`, q));
  }

  return { errors, warnings };
}
