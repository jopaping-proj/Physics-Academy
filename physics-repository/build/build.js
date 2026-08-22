#!/usr/bin/env node
/**
 * Static site build script — no framework, no bundler.
 * Reads lesson content from content/**\/*.json, renders each through
 * build/templates/lesson.html, and writes static pages to dist/.
 * Also copies css/, js/, assets/, and data/ into dist/ so the output
 * folder is a fully self-contained deployable site (GitHub Pages
 * publishes dist/ directly).
 *
 * Run: node build/build.js
 *
 * Lesson content JSON schema (one file per lesson under content/):
 * {
 *   "id": "ap1-u2-l3",
 *   "slug": "newtons-second-law",          // output path segment
 *   "course": "AP Physics 1",
 *   "unit": "Unit 2: Dynamics",
 *   "topic": "Newton's Laws",
 *   "lessonTitle": "Newton's Second Law: Force, Mass, and Acceleration",
 *   "prerequisites": ["..."],
 *   "majorObjective": "...",
 *   "subObjectives": ["...", "..."],
 *   "hook": { "prompt": "md", "choices": ["...","..."], "correctIndex": 1 },
 *   "priorKnowledge": "md",
 *   "chunks": [
 *     { "id": "chunk-1", "title": "...", "concept": "md",
 *       "representation": "md", "workedExample": {"scaffold":"full","steps":["..."]},
 *       "formativeCheck": { ...question-bank-schema-object... } }
 *   ],
 *   "interactiveComponent": { "type": "formula-explorer", "description": "md" },
 *   "misconceptions": [ { "statement": "...", "diagnostic": "md", "correction": "md" } ],
 *   "representationConnections": "md",
 *   "lessonAssessment": [ ...question-bank-schema-objects... ],
 *   "apIbConnection": "md",
 *   "summary": "md",
 *   "exitQuestion": { ...question-bank-schema-object... },
 *   "furtherPracticeQuestionIds": ["ap1-u2-l3-q01", "..."]
 * }
 * ("md" fields support a minimal Markdown subset — see mdToHtml below.)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, "content");
const DIST_DIR = path.join(ROOT, "dist");
const TEMPLATES_DIR = path.join(ROOT, "build", "templates");

// ---------- tiny markdown subset (no dependency) ----------
// Supports: paragraphs (blank-line separated), **bold**, *italic*, `code`.
// Inline $...$ / $$...$$ math is left untouched for KaTeX auto-render.
function mdToHtml(md) {
  if (!md) return "";
  return md
    .trim()
    .split(/\n\s*\n/)
    .map((para) => {
      const inline = para
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // undo the escaping inside math delimiters so KaTeX still sees raw LaTeX
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      return `<p>${inline}</p>`;
    })
    .join("\n");
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- section renderers ----------

function renderHook(hook) {
  if (!hook) return "";
  const choices = (hook.choices || [])
    .map((c, i) => `<button type="button" class="quiz__choice" data-index="${i}">${esc(c)}</button>`)
    .join("\n");
  return `
<section id="hook" class="card hook-card">
  <div class="hook-card__label">Before We Begin</div>
  ${mdToHtml(hook.prompt)}
  <div class="quiz" data-correct-index="${hook.correctIndex ?? ""}">
    ${choices}
  </div>
  <p><em>Commit to an answer before continuing.</em></p>
</section>`;
}

function renderObjectives(lesson) {
  const subs = (lesson.subObjectives || []).map((s) => `<li>${esc(s)}</li>`).join("\n");
  return `
<section id="objectives" class="card">
  <h2>Learning Objectives</h2>
  <p><strong>${esc(lesson.majorObjective || "")}</strong></p>
  <ul class="objective-list">
    ${subs}
  </ul>
</section>`;
}

function renderPriorKnowledge(md) {
  if (!md) return "";
  return `
<section id="prior-knowledge" class="card">
  <h2>Prior Knowledge</h2>
  ${mdToHtml(md)}
</section>`;
}

function renderFormativeCheck(check, idSuffix) {
  if (!check) return "";
  const choices = (check.choices || [])
    .map((c, i) => `<button type="button" class="quiz__choice" data-index="${i}">${esc(c)}</button>`)
    .join("\n");
  return `
  <div class="quiz" id="formative-check-${idSuffix}" data-question-id="${esc(check.id || "")}"
       data-difficulty="${esc(check.difficulty || "")}">
    ${check.difficulty ? `<span class="difficulty-badge" data-difficulty="${esc(check.difficulty)}">${esc(check.difficulty)}</span>` : ""}
    <p>${esc(check.question || "")}</p>
    ${choices}
  </div>`;
}

function renderChunk(chunk, index) {
  const worked = chunk.workedExample
    ? `
    <div class="card worked-example" data-scaffold="${esc(chunk.workedExample.scaffold || "full")}">
      <h4>Worked Example</h4>
      <ol class="worked-example__steps">
        ${(chunk.workedExample.steps || []).map((s) => `<li>${esc(s)}</li>`).join("\n")}
      </ol>
    </div>`
    : "";

  return `
<section id="${esc(chunk.id || `chunk-${index}`)}">
  <div class="concept-chunk__label">Concept Chunk ${index}</div>
  <h2>${esc(chunk.title || "")}</h2>
  ${mdToHtml(chunk.concept)}
  ${chunk.representation ? `<div class="card">${mdToHtml(chunk.representation)}</div>` : ""}
  ${worked}
  ${renderFormativeCheck(chunk.formativeCheck, chunk.id || index)}
</section>`;
}

function renderInteractiveComponent(ic) {
  if (!ic) return "";
  return `
<section id="interactive-component" class="card interactive-panel" data-type="${esc(ic.type || "")}">
  <h2>Interactive: ${esc(ic.type || "")}</h2>
  ${mdToHtml(ic.description)}
  <div class="interactive-panel__controls"></div>
  <div class="interactive-panel__canvas-wrap"></div>
  <p><em>(Renders client-side via js/formula-explorer.js, js/graphs.js, or js/simulations.js depending on type — not pre-rendered at build time.)</em></p>
</section>`;
}

function renderMisconceptions(list) {
  if (!list || !list.length) return "";
  const items = list
    .map(
      (m) => `
    <div class="card misconception-card">
      <div class="misconception-card__label">Common Misconception</div>
      <p><strong>${esc(m.statement)}</strong></p>
      ${m.diagnostic ? `<p><em>Diagnostic:</em> ${esc(m.diagnostic)}</p>` : ""}
      ${mdToHtml(m.correction)}
    </div>`
    )
    .join("\n");
  return `
<section id="misconceptions">
  <h2>Common Misconceptions</h2>
  ${items}
</section>`;
}

function renderRepresentationConnections(md) {
  if (!md) return "";
  return `
<section id="representation-connections" class="card">
  <h2>Representation Connections</h2>
  ${mdToHtml(md)}
</section>`;
}

function renderLessonAssessment(questions) {
  if (!questions || !questions.length) return "";
  return `
<section id="lesson-assessment">
  <h2>Lesson-Level Formative Assessment</h2>
  ${questions.map((q, i) => renderFormativeCheck(q, `lesson-${i}`)).join("\n")}
</section>`;
}

function renderApIbConnection(md) {
  if (!md) return "";
  return `
<section id="ap-ib-connection" class="card exam-card">
  <span class="exam-card__badge">AP / IB Connection</span>
  ${mdToHtml(md)}
</section>`;
}

function renderSummary(md) {
  if (!md) return "";
  return `
<section id="summary" class="card">
  <h2>Summary</h2>
  ${mdToHtml(md)}
</section>`;
}

function renderExitQuestion(q) {
  if (!q) return "";
  return `
<section id="exit-question">
  <h2>Retrieval / Exit Question</h2>
  ${renderFormativeCheck(q, "exit")}
</section>`;
}

function renderFurtherPractice(ids) {
  if (!ids || !ids.length) return "";
  return `
<section id="further-practice">
  <h2>Further Practice</h2>
  <div class="further-practice__tier">
    <div class="further-practice__tier-title">Foundation</div>
    <p><em>Populated client-side from the question bank via js/difficulty.js groupByLessonTier().</em></p>
  </div>
  <div class="further-practice__tier">
    <div class="further-practice__tier-title">Examination Readiness</div>
  </div>
  <div class="further-practice__tier">
    <div class="further-practice__tier-title">Mastery / Distinction</div>
  </div>
</section>`;
}

function renderLessonBody(lesson) {
  const sections = [
    renderHook(lesson.hook),
    renderObjectives(lesson),
    renderPriorKnowledge(lesson.priorKnowledge),
    ...(lesson.chunks || []).map((c, i) => renderChunk(c, i + 1)),
    renderInteractiveComponent(lesson.interactiveComponent),
    renderMisconceptions(lesson.misconceptions),
    renderRepresentationConnections(lesson.representationConnections),
    renderLessonAssessment(lesson.lessonAssessment),
    renderApIbConnection(lesson.apIbConnection),
    renderSummary(lesson.summary),
    renderExitQuestion(lesson.exitQuestion),
    renderFurtherPractice(lesson.furtherPracticeQuestionIds),
  ];
  return sections.filter(Boolean).join("\n");
}

function renderSidebarToc(lesson) {
  const items = [
    ["hook", "Before We Begin"],
    ["objectives", "Learning Objectives"],
    ["prior-knowledge", "Prior Knowledge"],
    ...(lesson.chunks || []).map((c, i) => [c.id || `chunk-${i + 1}`, c.title || `Chunk ${i + 1}`]),
    ["interactive-component", "Interactive Component"],
    ["misconceptions", "Common Misconceptions"],
    ["representation-connections", "Representation Connections"],
    ["lesson-assessment", "Lesson Assessment"],
    ["ap-ib-connection", "AP / IB Connection"],
    ["summary", "Summary"],
    ["exit-question", "Exit Question"],
    ["further-practice", "Further Practice"],
  ];
  return items
    .filter(([id]) => id)
    .map(([id, label]) => `      <li><a href="#${esc(id)}">${esc(label)}</a></li>`)
    .join("\n");
}

function renderSidebarObjectives(lesson) {
  return (lesson.subObjectives || []).map((s) => `      <li>${esc(s)}</li>`).join("\n");
}

// ---------- file walking ----------

function findLessonFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findLessonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

function copyStaticDirs() {
  for (const dir of ["css", "js", "assets", "data"]) {
    const src = path.join(ROOT, dir);
    const dest = path.join(DIST_DIR, dir);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}

// ---------- main ----------

function build() {
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  copyStaticDirs();

  const lessonTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "lesson.html"), "utf8");
  const files = findLessonFiles(CONTENT_DIR);
  const builtLessons = [];

  for (const file of files) {
    const relFromContent = path.relative(CONTENT_DIR, file); // e.g. ap-physics-1/unit-2-dynamics/newtons-second-law.json
    const lesson = JSON.parse(fs.readFileSync(file, "utf8"));

    const outRel = relFromContent.replace(/\.json$/, ".html");
    const outPath = path.join(DIST_DIR, outRel);
    const depth = outRel.split(path.sep).length - 1;
    const rootPrefix = depth > 0 ? "../".repeat(depth) : "./";

    const html = lessonTemplate
      .replaceAll("{{ROOT}}", rootPrefix)
      .replace("{{TITLE}}", esc(lesson.lessonTitle || lesson.id))
      .replace(
        "{{BREADCRUMB}}",
        [lesson.course, lesson.unit, lesson.topic].filter(Boolean).map(esc).join(" › ")
      )
      .replace("{{SIDEBAR_TOC}}", renderSidebarToc(lesson))
      .replace("{{SIDEBAR_OBJECTIVES}}", renderSidebarObjectives(lesson))
      .replace("{{LESSON_BODY}}", renderLessonBody(lesson))
      .replace("{{LESSON_DATA_JSON}}", JSON.stringify(lesson));

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, "utf8");
    builtLessons.push({ ...lesson, outRel });
    console.log(`[build] ${relFromContent} -> dist/${outRel}`);
  }

  buildHomepage(builtLessons);
  console.log(`[build] Done. ${builtLessons.length} lesson page(s) built.`);
}

function buildHomepage(lessons) {
  const homepageTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "homepage.html"), "utf8");
  const byCourse = {};
  for (const l of lessons) {
    byCourse[l.course] = byCourse[l.course] || [];
    byCourse[l.course].push(l);
  }
  const courseList = Object.entries(byCourse)
    .map(
      ([course, ls]) => `
    <h3>${esc(course)}</h3>
    <ul>
      ${ls.map((l) => `<li><a href="${esc(l.outRel)}">${esc(l.lessonTitle)}</a></li>`).join("\n")}
    </ul>`
    )
    .join("\n");

  const html = homepageTemplate.replace(
    "{{COURSE_LIST}}",
    courseList || "<p>No lessons built yet.</p>"
  );
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), html, "utf8");
}

build();
