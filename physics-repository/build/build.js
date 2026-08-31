#!/usr/bin/env node
/**
 * Static site build — no framework, no bundler.
 * Reads content/**\/*.json, renders each lesson through
 * build/templates/lesson.html, and writes static pages to dist/ (plus
 * copies of css/, js/, assets/, data/, simulations/ so dist/ is a
 * self-contained deployable site — GitHub Pages publishes it directly,
 * see .github/workflows/pages.yml).
 *
 * Run: node build/build.js
 *
 * ---- WHERE THINGS LIVE ----
 * This file is orchestration only: walk content/, fill the templates,
 * build the homepage. All lesson markup is produced by the render
 * components in build/render/:
 *   render/primitives.js      esc/attr, the <section class="slide"> shell,
 *                             inlined SVG figures, the quiz mount
 *   render/worked-example.js  the subgoal-phased worked example
 *   render/sections.js        one `*Slides()` per lesson-JSON section +
 *                             collectSlideSpecs / renderLessonBody /
 *                             renderSidebarToc
 * The component catalogue (what each maps to) is docs/architecture-proposal.md §4.
 *
 * ---- SLIDE DELIVERY MODEL ----
 * Every lesson page is a *deck*: one card ("slide") at a time,
 * learner-paced, with a comprehension gate and a "Read as one page"
 * fallback (segmenting + coherence principles). js/lesson-slides.js
 * runs the deck; this build only emits the slides, one
 * <section class="slide" data-group="…"> each.
 *
 * ---- INTERACTIVITY MODEL ----
 * Every FormativeCheck is an empty `.quiz-mount` holding its question
 * JSON in an embedded <script type="application/json">; js/assessment.js
 * renders the interactive quiz. Never hand-render quiz buttons here.
 * `componentKey` values map to a script path via COMPONENT_SCRIPTS below;
 * that script self-mounts on DOMContentLoaded via its own
 * [data-component-key] element.
 *
 * ---- LESSON CONTENT JSON SCHEMA (one file per lesson under content/) ----
 * {
 *   "id": "ap1-u2-l3",
 *   "slug": "newtons-second-law",          // output path segment (unused today; path comes from the file location)
 *   "course": "AP Physics 1",
 *   "unit": "Unit 2: Dynamics",
 *   "topic": "Newton's Laws",
 *   "lessonTitle": "…",
 *   "prerequisites": ["…"],
 *   "majorObjective": "…",
 *   "subObjectives": ["…"],
 *   "hook": { "prompt": "md", "choices": ["…"], "correctIndex": 1 },
 *   "priorKnowledge": "md",
 *   "chunks": [
 *     { "id": "chunk-1", "title": "…", "concept": "md", "representation": "md",
 *       "figures": [ { "svg": "<lesson>/fbd-box.svg", "caption": "md" } ],   // inlined from assets/diagrams/, on the representation card
 *       "workedExample": { "scaffold": "full", "problem": "…",
 *                          "figure": { "svg": "…", "caption": "md" },
 *                          "phases": [ { "label": "…", "steps": ["md"] } ],
 *                          "keyMove": "md" },
 *       "formativeCheck": { …question-bank-schema-object… } }
 *   ],
 *   "interactiveComponent": { "type": "formula-explorer", "componentKey": "…",
 *                             "description": "md", "graphs": [ { "key": "f-vs-m", "label": "…" } ] },
 *   "simulation": { "componentKey": "cart-force-mass", "title": "…", "description": "md",
 *                   "predictionPrompt": { "question": "…", "choices": ["…"] } },
 *   "misconceptions": [ …question-bank-schema-objects… ],
 *   "errorAnalysis": [ { "studentWork": "md", "prompts": ["md"], "modelResponse": "md", "responseMaxLength": 600 } ],
 *   "representationConnections": "md",
 *   "lessonAssessment": [ …question-bank-schema-objects… ],
 *   "examConnection": "md",
 *   "summary": "md",
 *   "exitQuestion": { …question-bank-schema-object… },
 *   "questionBankFile": "ap1-u2-dynamics.json",
 *   "furtherPracticeQuestionIds": ["…"],
 *   "needsPlotly": false                   // set true only if an interactive actually wants Plotly
 * }
 * ("md" fields support the shared Markdown subset in js/markdown.js —
 * **bold**, *italic*, ==highlight==, [[key term]], `code`.)
 */

import fs from "node:fs";
import path from "node:path";
import { ROOT, CONTENT_DIR, DIST_DIR, TEMPLATES_DIR } from "./render/paths.js";
import { esc } from "./render/primitives.js";
import { loadQuestionBank, renderLessonBody, renderSidebarToc } from "./render/sections.js";

// componentKey -> script path (relative to the repo root). Each script
// self-mounts on DOMContentLoaded by querying its own
// [data-component-key] element. Every new interactive needs an entry here.
const COMPONENT_SCRIPTS = {
  "newtons-second-law-explorer": "js/lesson-interactives/newtons-second-law-explorer.js",
  "cart-force-mass": "simulations/cart-force-mass/index.js",
};

const STATIC_DIRS = ["css", "js", "assets", "data", "simulations"];

function findLessonFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findLessonFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".json")) results.push(full);
  }
  return results;
}

function copyStaticDirs() {
  for (const dir of STATIC_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(DIST_DIR, dir), { recursive: true });
  }
}

function buildLesson(file, lessonTemplate) {
  const relFromContent = path.relative(CONTENT_DIR, file);
  const lesson = JSON.parse(fs.readFileSync(file, "utf8"));
  const bank = loadQuestionBank(lesson);

  const outRel = relFromContent.replace(/\.json$/, ".html");
  const outPath = path.join(DIST_DIR, outRel);
  const depth = outRel.split(path.sep).length - 1;
  const rootPrefix = depth > 0 ? "../".repeat(depth) : "./";

  const plotlyScript = lesson.needsPlotly
    ? '<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>'
    : "";

  const componentScripts = [lesson.interactiveComponent?.componentKey, lesson.simulation?.componentKey]
    .filter(Boolean)
    .map((key) => COMPONENT_SCRIPTS[key])
    .filter(Boolean)
    .map((src) => `<script src="${rootPrefix}${src}"></script>`)
    .join("\n");

  const html = lessonTemplate
    .replaceAll("{{ROOT}}", rootPrefix)
    .replace("{{TITLE}}", esc(lesson.lessonTitle || lesson.id))
    .replace(
      "{{BREADCRUMB}}",
      [lesson.course, lesson.unit, lesson.topic].filter(Boolean).map(esc).join(" › ")
    )
    .replace("{{SIDEBAR_TOC}}", renderSidebarToc(lesson, bank))
    .replace("{{LESSON_BODY}}", renderLessonBody(lesson, bank))
    .replace("{{LESSON_DATA_JSON}}", JSON.stringify(lesson))
    .replace("{{PLOTLY_SCRIPT}}", plotlyScript)
    .replace("{{COMPONENT_SCRIPTS}}", componentScripts);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`[build] ${relFromContent} -> dist/${outRel}`);
  return { ...lesson, outRel };
}

function buildHomepage(lessons) {
  const homepageTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "homepage.html"), "utf8");
  const byCourse = {};
  for (const l of lessons) (byCourse[l.course] = byCourse[l.course] || []).push(l);

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

function build() {
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Tell GitHub Pages not to run Jekyll over the output (harmless elsewhere).
  fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "");

  copyStaticDirs();

  const lessonTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "lesson.html"), "utf8");
  const builtLessons = findLessonFiles(CONTENT_DIR).map((file) => buildLesson(file, lessonTemplate));

  buildHomepage(builtLessons);
  console.log(`[build] Done. ${builtLessons.length} lesson page(s) built.`);
}

build();
