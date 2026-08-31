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
 * ---- SLIDE DELIVERY MODEL (revised 2026-08-31) ----
 * Every lesson page is a *deck*: one card ("slide") visible at a time,
 * learner-paced with Back / Next, a progress bar, and a "Read as one
 * page" toggle. This is the segmenting principle (Mayer) — complex
 * material presented in learner-controlled segments — plus the
 * coherence principle (one idea per card, secondary detail tucked into
 * <details>). js/lesson-slides.js runs the deck; this script only
 * emits the slides.
 *
 * A slide is:
 *   <section class="slide [modifier]" id="…"
 *            data-group="chunk-1" data-group-label="1 · …"
 *            data-slide-title="The idea">
 *     <div class="slide__inner"> … </div>
 *   </section>
 * `data-group` collapses several slides under one sidebar entry;
 * `data-slide-title` names the slide in the deck bar.
 *
 * Section renderers below return **arrays of slide descriptors**
 * `{ id, group, groupLabel, title, cls, body }`; renderLessonBody
 * flattens them and wrapSlide() adds the <section> shell.
 *
 * ---- INTERACTIVITY MODEL ----
 * Every FormativeCheck is emitted as an empty `.quiz-mount` holding its
 * question JSON in an embedded `<script type="application/json">` —
 * js/assessment.js renders the interactive quiz into it. Do NOT
 * hand-render quiz buttons here.
 *
 * ---- WORKED EXAMPLES ----
 * `chunk.workedExample` supports:
 *   { "scaffold": "full|partial|hinted|independent",
 *     "problem": "one-line statement of the task",
 *     "phases": [ { "label": "Set up the problem", "steps": ["md", …] }, … ],
 *     "keyMove": "one-line self-explanation answer" }
 * Phases are subgoal-labelled groups (Catrambone) revealed one at a
 * time (js/lesson-slides.js). A legacy flat `steps: […]` array still
 * works — it renders as a single unlabelled phase.
 *
 * Lesson content JSON schema (one file per lesson under content/):
 * {
 *   "id": "ap1-u2-l3",
 *   "slug": "newtons-second-law",          // output path segment
 *   "course": "AP Physics 1",
 *   "unit": "Unit 2: Dynamics",
 *   "topic": "Newton's Laws",
 *   "lessonTitle": "…",
 *   "prerequisites": ["…"],
 *   "majorObjective": "…",
 *   "subObjectives": ["…", "…"],
 *   "hook": { "prompt": "md", "choices": ["…"], "correctIndex": 1 },
 *   "priorKnowledge": "md",
 *   "chunks": [
 *     { "id": "chunk-1", "title": "…", "concept": "md",
 *       "representation": "md",
 *       "figures": [ { "svg": "<lesson>/fbd-box.svg", "caption": "md" } ],  // optional; inlined from assets/diagrams/, shown on the representation card
 *       "workedExample": { "scaffold": "full", "problem": "…",
 *                          "figure": { "svg": "…", "caption": "md" },       // optional single figure at the top of the example
 *                          "phases": [ { "label": "…", "steps": ["…"] } ],
 *                          "keyMove": "…" },
 *       "formativeCheck": { …question-bank-schema-object… } }
 *   ],
 *   "interactiveComponent": {
 *     "type": "formula-explorer", "componentKey": "…", "description": "md",
 *     "graphs": [ { "key": "f-vs-m", "label": "…" } ]  // optional; one canvas-wrap per entry
 *   },
 *   "simulation": {
 *     "componentKey": "cart-force-mass", "title": "…", "description": "md",
 *     "predictionPrompt": { "question": "…", "choices": ["…"] }
 *   },
 *   "misconceptions": [ …question-bank-schema-objects… ],
 *   "errorAnalysis": [
 *     { "studentWork": "md", "prompts": ["md"], "modelResponse": "md", "responseMaxLength": 600 }
 *   ],
 *   "representationConnections": "md",
 *   "lessonAssessment": [ …question-bank-schema-objects… ],
 *   "examConnection": "md",   // course-neutral: exam-style reasoning this lesson feeds
 *   "summary": "md",
 *   "exitQuestion": { …question-bank-schema-object… },
 *   "questionBankFile": "ap1-u2-dynamics.json",
 *   "furtherPracticeQuestionIds": ["ap1-u2-l3-fp02", "…"]
 * }
 *
 * `componentKey` values map to a script path via COMPONENT_SCRIPTS
 * below — emitted as a plain <script> that self-mounts on
 * DOMContentLoaded by querying its own `[data-component-key]` element.
 * ("md" fields support the shared Markdown subset in js/markdown.js —
 * **bold**, *italic*, ==highlight==, [[key term]], `code`.)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mdInline, mdToHtml } from "../js/markdown.js";
import { groupByLessonTier } from "../js/difficulty.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, "content");
const DIST_DIR = path.join(ROOT, "dist");
const TEMPLATES_DIR = path.join(ROOT, "build", "templates");
const QUESTION_BANK_DIR = path.join(ROOT, "data", "question-bank");

const COMPONENT_SCRIPTS = {
  "newtons-second-law-explorer": "js/lesson-interactives/newtons-second-law-explorer.js",
  "cart-force-mass": "simulations/cart-force-mass/index.js",
};

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attr(str) {
  return esc(str).replace(/"/g, "&quot;");
}

// ---------- slide plumbing ----------

/** Wrap one slide descriptor in its <section> shell. One heading per
 * card (signaling principle): the group label is the <h2>, the optional
 * subtitle names this card's role within a multi-card group, and bodies
 * never repeat either. */
function wrapSlide(s, indexInGroup, groupSize) {
  const stepHint =
    groupSize > 1 ? `<span class="slide__step">${indexInGroup + 1} / ${groupSize}</span>` : "";
  const ck = s.componentKey ? ` data-component-key="${attr(s.componentKey)}"` : "";
  return `
<section class="slide ${s.cls || ""}" id="${attr(s.id)}"${ck} tabindex="-1"
         data-group="${attr(s.group)}" data-group-label="${attr(s.groupLabel)}"
         data-slide-title="${attr(s.title || s.subtitle || s.groupLabel)}">
  <div class="slide__inner">
    <header class="slide__head">
      <h2 class="slide__title">${esc(s.groupLabel)}</h2>
      ${s.subtitle ? `<p class="slide__subtitle">${esc(s.subtitle)}</p>` : ""}
      ${stepHint}
    </header>
    <div class="slide__body">
      ${s.body}
    </div>
  </div>
</section>`;
}

// ---------- section renderers (return arrays of slide descriptors) ----------

const DIAGRAMS_DIR = path.join(ROOT, "assets", "diagrams");

/** Inlines one authored SVG (path relative to assets/diagrams/) as a
 * <figure>. Inlining keeps it themeable and saves a request; the SVG
 * carries its own role="img" + aria-label. */
function renderFigure(fig) {
  if (!fig || !fig.svg) return "";
  const p = path.join(DIAGRAMS_DIR, fig.svg);
  let svg;
  try {
    svg = fs.readFileSync(p, "utf8");
  } catch {
    console.warn(`[build] WARNING: figure not found: assets/diagrams/${fig.svg}`);
    return "";
  }
  svg = svg.replace(/<\?xml[^>]*\?>\s*/i, "").trim();
  const caption = fig.caption ? `<figcaption>${mdInline(fig.caption)}</figcaption>` : "";
  return `<figure class="figure">${svg}${caption}</figure>`;
}

function renderFigures(figures) {
  if (!Array.isArray(figures) || !figures.length) return "";
  return `<div class="figure-row">${figures.map(renderFigure).join("\n")}</div>`;
}

/** Emits an empty mount + embedded question JSON. js/assessment.js renders it. */
function renderFormativeCheck(check, idSuffix) {
  if (!check) return "";
  return `
  <div class="quiz-mount" id="formative-check-${esc(idSuffix)}">
    <script type="application/json" class="quiz-question-data">${JSON.stringify(check)}</script>
  </div>`;
}

function hookSlides(hook) {
  if (!hook) return [];
  const choices = (hook.choices || [])
    .map((c, i) => `<button type="button" class="quiz__choice" data-index="${i}">${mdInline(c)}</button>`)
    .join("\n");
  return [
    {
      id: "hook",
      group: "opening",
      groupLabel: "Before We Begin",
      subtitle: "Predict first — commit before you read on",
      cls: "hook-card",
      body: `
  ${mdToHtml(hook.prompt)}
  <div class="quiz hook-card__quiz" data-correct-index="${hook.correctIndex ?? ""}">
    ${choices}
  </div>
  <button type="button" class="hook-card__submit" disabled>Submit</button>
  <p class="hook-card__hint-text"><em>You'll see if you were right — the reasoning comes later in the lesson.</em></p>`,
    },
  ];
}

function objectivesSlides(lesson) {
  const subs = (lesson.subObjectives || []).map((s) => `<li>${mdInline(s)}</li>`).join("\n");
  return [
    {
      id: "objectives",
      group: "objectives",
      groupLabel: "Learning Objectives",
      subtitle: "What you'll be able to do by the end",
      body: `
  <p class="lead"><strong>${mdInline(lesson.majorObjective || "")}</strong></p>
  <ul class="objective-list">
    ${subs}
  </ul>`,
    },
  ];
}

function priorKnowledgeSlides(md) {
  if (!md) return [];
  return [
    {
      id: "prior-knowledge",
      group: "prior",
      groupLabel: "Prior Knowledge",
      subtitle: "Bring this with you",
      body: mdToHtml(md),
    },
  ];
}

/** One worked example → the reveal-by-phase widget (js/lesson-slides.js). */
function renderWorkedExample(we) {
  if (!we) return "";
  const phases =
    Array.isArray(we.phases) && we.phases.length
      ? we.phases
      : [{ label: "", steps: we.steps || [] }];

  const phaseList = phases
    .map((p, i) => {
      const steps = (p.steps || []).map((s) => `<li>${mdInline(s)}</li>`).join("\n");
      return `
    <li class="we-phase" data-phase="${i}"${i === 0 ? "" : " hidden"}>
      ${p.label ? `<p class="we-phase__label">${esc(p.label)}</p>` : ""}
      <ol class="we-phase__steps">
        ${steps}
      </ol>
    </li>`;
    })
    .join("\n");

  const keyMove = we.keyMove
    ? `
  <div class="worked-example__keymove" hidden>
    <button type="button" class="worked-example__keymove-toggle">Before you check: what was the one move that mattered here?</button>
    <p class="worked-example__keymove-text" hidden>${mdInline(we.keyMove)}</p>
  </div>`
    : "";

  return `
  <div class="worked-example" data-scaffold="${esc(we.scaffold || "full")}" data-phases="${phases.length}">
    <div class="worked-example__head">
      <span class="worked-example__badge">Worked Example</span>
      <button type="button" class="worked-example__showall">Show all steps</button>
    </div>
    ${we.problem ? `<p class="worked-example__problem">${mdInline(we.problem)}</p>` : ""}
    ${renderFigure(we.figure)}
    <ol class="we-phases">
      ${phaseList}
    </ol>
    <button type="button" class="worked-example__next">Reveal next part ▸</button>
    ${keyMove}
  </div>`;
}

function chunkSlides(chunk, index) {
  const base = chunk.id || `chunk-${index}`;
  const groupLabel = `Concept ${index} · ${chunk.title || ""}`.trim().replace(/·\s*$/, "");
  const slides = [];

  slides.push({
    id: `${base}`,
    group: base,
    groupLabel,
    subtitle: "The core idea",
    body: mdToHtml(chunk.concept),
  });

  if (chunk.representation || (chunk.figures && chunk.figures.length)) {
    slides.push({
      id: `${base}-representation`,
      group: base,
      groupLabel,
      subtitle: "Another way to see it",
      cls: (chunk.figures && chunk.figures.length) ? "slide--scroller" : "",
      body: `${mdToHtml(chunk.representation)}${renderFigures(chunk.figures)}`,
    });
  }

  if (chunk.workedExample) {
    slides.push({
      id: `${base}-example`,
      group: base,
      groupLabel,
      subtitle: "Worked example — reveal it one part at a time",
      body: renderWorkedExample(chunk.workedExample),
    });
  }

  if (chunk.formativeCheck) {
    slides.push({
      id: `${base}-check`,
      group: base,
      groupLabel,
      subtitle: "Your turn",
      body: renderFormativeCheck(chunk.formativeCheck, base),
    });
  }

  return slides;
}

function formatComponentTitle(type) {
  return String(type || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function interactiveComponentSlides(ic) {
  if (!ic) return [];
  const graphsMarkup =
    ic.graphs && ic.graphs.length
      ? `
  <div class="sim-graphs" data-locked="false">
    ${ic.graphs
      .map(
        (g) =>
          `<div class="interactive-panel__canvas-wrap" data-graph="${attr(g.key)}" role="img" aria-label="${attr(g.label || "")}"></div>`
      )
      .join("\n")}
  </div>`
      : `<div class="interactive-panel__canvas-wrap"></div>`;
  return [
    {
      id: "interactive-component",
      group: "explore",
      groupLabel: "Formula Explorer",
      subtitle: "Slope of the line = acceleration",
      cls: "interactive-panel",
      componentKey: ic.componentKey,
      body: `
  ${mdToHtml(ic.description)}
  <div class="interactive-panel__controls"></div>
  <div class="sim-readouts"></div>
  <div class="sim-lock-row"></div>
  ${graphsMarkup}
  <div class="sim-prompt"></div>
  <div class="sim-insight"></div>`,
    },
  ];
}

function simulationSlides(sim) {
  if (!sim) return [];
  return [
    {
      id: "simulation",
      group: "sim",
      groupLabel: `Simulation · ${sim.title || ""}`.trim().replace(/·\s*$/, ""),
      subtitle: "Predict, then press Play",
      cls: "interactive-panel",
      componentKey: sim.componentKey,
      body: `
  ${mdToHtml(sim.description)}
  <div class="interactive-panel__controls"></div>
  <div class="sim-split sim-split--track">
    <div class="interactive-panel__canvas-wrap interactive-panel__canvas-wrap--sim" data-role="track"></div>
    <div class="interactive-panel__canvas-wrap interactive-panel__canvas-wrap--graph" data-role="graph"></div>
  </div>`,
    },
  ];
}

/** Each misconception check is its own slide (one idea per card). */
function misconceptionSlides(list) {
  if (!list || !list.length) return [];
  return list.map((m, i) => ({
    id: `misconception-${i}`,
    group: "miscon",
    groupLabel: "Common Misconceptions",
    subtitle: `${i + 1} of ${list.length} — answer, then read why every option is right or wrong`,
    body: renderFormativeCheck(m, `misconception-${i}`),
  }));
}

function errorAnalysisSlides(list) {
  if (!list || !list.length) return [];
  return list.map((e, i) => {
    const maxLength = e.responseMaxLength || 600;
    return {
      id: `error-analysis-${i}`,
      group: "errors",
      groupLabel: "Error Analysis",
      subtitle: `Spot the flawed reasoning${list.length > 1 ? ` (${i + 1} of ${list.length})` : ""}`,
      cls: "error-analysis-card",
      body: `
  ${mdToHtml(e.studentWork)}
  <ol>
    ${(e.prompts || []).map((p) => `<li>${mdInline(p)}</li>`).join("\n")}
  </ol>
  <div class="error-analysis__response" data-max-length="${maxLength}">
    <label class="visually-hidden" for="ea-response-${i}">Your response</label>
    <textarea id="ea-response-${i}" class="error-analysis__textarea" maxlength="${maxLength}"
      placeholder="Write your response to the prompts above…"></textarea>
    <div class="error-analysis__footer">
      <span class="error-analysis__counter">0 / ${maxLength}</span>
      <button type="button" class="error-analysis__submit" disabled>Submit</button>
    </div>
    <div class="error-analysis__model-response" hidden>
      <div class="error-analysis__model-response-label">Model Response</div>
      ${mdToHtml(e.modelResponse)}
    </div>
  </div>`,
    };
  });
}

function representationConnectionsSlides(md) {
  if (!md) return [];
  return [
    {
      id: "representation-connections",
      group: "connect",
      groupLabel: "Representation Connections",
      subtitle: "How the words, picture, graph and equation line up",
      body: mdToHtml(md),
    },
  ];
}

function lessonAssessmentSlides(questions) {
  if (!questions || !questions.length) return [];
  return questions.map((q, i) => ({
    id: `lesson-${i}`,
    group: "check",
    groupLabel: "Lesson Check",
    subtitle: `Question ${i + 1} of ${questions.length}`,
    body: renderFormativeCheck(q, `lesson-${i}`),
  }));
}

function examConnectionSlides(md) {
  if (!md) return [];
  return [
    {
      id: "exam-connection",
      group: "exam",
      groupLabel: "Exam Connection",
      subtitle: "What the exam does with this idea",
      cls: "exam-card",
      body: mdToHtml(md),
    },
  ];
}

function summarySlides(md) {
  if (!md) return [];
  return [
    {
      id: "summary",
      group: "summary",
      groupLabel: "Summary",
      subtitle: "The whole lesson on one card",
      cls: "slide--scroller",
      body: mdToHtml(md),
    },
  ];
}

function exitQuestionSlides(q) {
  if (!q) return [];
  return [
    {
      id: "exit-question",
      group: "exit",
      groupLabel: "Exit Question",
      subtitle: "One last transfer question — no new content, just apply it",
      body: renderFormativeCheck(q, "exit"),
    },
  ];
}

const TIER_LABELS = {
  "foundation": "Foundation",
  "examination-readiness": "Examination Readiness",
  "mastery-distinction": "Mastery / Distinction",
};

function loadQuestionBank(lesson) {
  if (!lesson.questionBankFile) return [];
  const bankPath = path.join(QUESTION_BANK_DIR, lesson.questionBankFile);
  if (!fs.existsSync(bankPath)) {
    console.warn(`[build] WARNING: question bank file not found: ${lesson.questionBankFile}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(bankPath, "utf8"));
}

function furtherPracticeSlides(lesson, bank) {
  const ids = lesson.furtherPracticeQuestionIds || [];
  if (!ids.length) return [];

  const selected = bank.filter((q) => ids.includes(q.id));
  const missing = ids.filter((id) => !selected.some((q) => q.id === id));
  if (missing.length) {
    console.warn(`[build] WARNING: furtherPracticeQuestionIds not found in question bank: ${missing.join(", ")}`);
  }

  const grouped = groupByLessonTier(selected);
  return Object.entries(grouped)
    .filter(([, qs]) => qs.length)
    .map(([tierKey, qs]) => ({
      id: `further-practice-${tierKey}`,
      group: "practice",
      groupLabel: "Further Practice",
      subtitle: `${TIER_LABELS[tierKey] || tierKey} — ${qs.length} question${qs.length === 1 ? "" : "s"}`,
      cls: "slide--scroller",
      body: qs.map((q, i) => renderFormativeCheck(q, `fp-${tierKey}-${i}`)).join("\n"),
    }));
}

/** The ordered slide descriptors for a lesson — the single source both
 * the page body and the sidebar TOC are built from. */
function collectSlideSpecs(lesson, bank) {
  return [
    ...hookSlides(lesson.hook),
    ...objectivesSlides(lesson),
    ...priorKnowledgeSlides(lesson.priorKnowledge),
    ...(lesson.chunks || []).flatMap((c, i) => chunkSlides(c, i + 1)),
    ...interactiveComponentSlides(lesson.interactiveComponent),
    ...simulationSlides(lesson.simulation),
    ...misconceptionSlides(lesson.misconceptions),
    ...errorAnalysisSlides(lesson.errorAnalysis),
    ...representationConnectionsSlides(lesson.representationConnections),
    ...lessonAssessmentSlides(lesson.lessonAssessment),
    ...examConnectionSlides(lesson.examConnection),
    ...summarySlides(lesson.summary),
    ...exitQuestionSlides(lesson.exitQuestion),
    ...furtherPracticeSlides(lesson, bank),
  ];
}

function renderLessonBody(lesson, bank) {
  const specs = collectSlideSpecs(lesson, bank);

  // per-group index/size for the "n / m" hint inside a multi-slide group
  const groupCounts = {};
  specs.forEach((s) => (groupCounts[s.group] = (groupCounts[s.group] || 0) + 1));
  const seen = {};
  return specs
    .map((s) => {
      const idx = seen[s.group] || 0;
      seen[s.group] = idx + 1;
      return wrapSlide(s, idx, groupCounts[s.group]);
    })
    .join("\n");
}

/** Sidebar: one entry per group, linking to that group's first slide. */
function renderSidebarToc(lesson, bank) {
  const specs = collectSlideSpecs(lesson, bank);
  const groups = [];
  for (const s of specs) {
    if (!groups.some((g) => g.group === s.group)) {
      groups.push({ group: s.group, label: s.groupLabel, firstId: s.id });
    }
  }
  return groups
    .map(
      (g) =>
        `      <li><a href="#${esc(g.firstId)}" data-group="${attr(g.group)}">${esc(g.label)}</a></li>`
    )
    .join("\n");
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
  for (const dir of ["css", "js", "assets", "data", "simulations"]) {
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

  // Tell GitHub Pages not to run Jekyll over the output (harmless elsewhere).
  fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "");

  copyStaticDirs();

  const lessonTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "lesson.html"), "utf8");
  const files = findLessonFiles(CONTENT_DIR);
  const builtLessons = [];

  for (const file of files) {
    const relFromContent = path.relative(CONTENT_DIR, file);
    const lesson = JSON.parse(fs.readFileSync(file, "utf8"));
    const bank = loadQuestionBank(lesson);

    const outRel = relFromContent.replace(/\.json$/, ".html");
    const outPath = path.join(DIST_DIR, outRel);
    const depth = outRel.split(path.sep).length - 1;
    const rootPrefix = depth > 0 ? "../".repeat(depth) : "./";

    const needsPlotly = Boolean(lesson.needsPlotly);
    const plotlyScript = needsPlotly
      ? '<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>'
      : "";

    const componentKeys = [lesson.interactiveComponent?.componentKey, lesson.simulation?.componentKey].filter(
      Boolean
    );
    const componentScripts = componentKeys
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
