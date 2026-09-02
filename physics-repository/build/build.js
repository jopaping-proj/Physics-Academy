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
 *   "lessonNumber": "1",                   // REQUIRED — place in the unit's teaching order; shown as "Lesson 1" in the breadcrumb, homepage, unit index
 *   "prerequisites": ["…"],
 *   "majorObjective": "…",
 *   "subObjectives": ["…"],
 *   "hook": { "prompt": "md", "choices": ["…"], "correctIndex": 1 },
 *   "priorKnowledge": "md",
 *   "chunks": [
 *     { "id": "chunk-1", "title": "…", "concept": "md", "representation": "md",
 *       "conceptFigures": [ { "svg": "…", "caption": "md" } ],               // on the concept card
 *       "figures": [ { "svg": "<lesson>/fbd-box.svg", "caption": "md" } ],   // on the representation card
 *       "workedExample": { "scaffold": "full", "problem": "…",
 *                          "figure": { "svg": "…", "caption": "md" },
 *                          "phases": [ { "label": "…", "steps": ["md"] } ],
 *                          "keyMove": "md" },
 *       "formativeCheck": { …question-bank-schema-object,                    // may also carry
 *                           "figures": [ { "svg": "…", "caption": "md" } ] } }  // a stem diagram
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
 * **bold**, *italic*, ==highlight==, [[key term]], `code`, a "- " bullet
 * list, a "1." ordered list, and a GFM pipe table. `$…$` / `$$…$$` math
 * is passed straight through for KaTeX; use `$$` for a stand-alone
 * equation that should render large and centred.)
 *
 * ---- CONCEPT-INVENTORY PAGES ----
 * A content file with `"format": "concept-inventory"` is NOT a slide
 * deck. It builds through build/templates/concept-inventory.html into a
 * single score-only form run by js/concept-inventory.js. Schema:
 * {
 *   "format": "concept-inventory",
 *   "lessonTitle": "…", "course": "…", "unit": "…",
 *   "diagnosticKey": "ap1-u2",       // localStorage attempt log key
 *   "intro": "md",                    // the policy notice
 *   "items": [ { "id": "ci-01", "misconception": "slug|newtonian-anchor",
 *                "pairId": "…", "stem": "md", "choices": ["md"], "correct": 2 } ]
 * }
 * Questions + choices are shuffled at runtime; only the score/percentage
 * is shown. See docs/ap-physics-1-unit-2-architecture.md §10.
 *
 * ---- UNIT INDEX PAGES ----
 * A content file with `"format": "unit-index"` builds through
 * build/templates/unit-index.html into a static ordered map of the unit:
 * concept-check (pre) → modules → concept-check (post). Schema:
 * {
 *   "format": "unit-index", "lessonTitle": "…", "course": "…", "unit": "…",
 *   "intro": "md",
 *   "sequence": [ { "type": "concept-check"|"module", "phase": "pre"|"post",
 *                   "label": "Module 1", "slug": "…" (null = not built yet),
 *                   "title": "…", "cluster": "C2.x", "status": "…", "note": "md" } ]
 * }
 *
 * ---- ITEM ALIGNMENT FIELDS ----
 * Every question and every lesson carries `objective` in the C-prefixed
 * cluster form ("C2.5") AND a `cedTopic` naming the real CED topic
 * ("2.5"); `courses` is a non-empty array of taxonomies.json course ids.
 * build/validate.js enforces all three (and the vocab of skill /
 * representation / difficulty / cognitiveLevel) and aborts the build.
 */

import fs from "node:fs";
import path from "node:path";
import { mdToHtml } from "../js/markdown.js";
import { ROOT, CONTENT_DIR, DIST_DIR, TEMPLATES_DIR } from "./render/paths.js";
import { esc, attr } from "./render/primitives.js";
import { loadQuestionBank, renderLessonBody, renderSidebarToc } from "./render/sections.js";
import { validateContent } from "./validate.js";

// componentKey -> script path (relative to the repo root). Each script
// self-mounts on DOMContentLoaded by querying its own
// [data-component-key] element. Every new interactive needs an entry here.
const COMPONENT_SCRIPTS = {
  "newtons-second-law-explorer": "js/lesson-interactives/newtons-second-law-explorer.js",
  "fbd-builder": "js/lesson-interactives/fbd-builder.js",
  "center-of-mass-explorer": "js/lesson-interactives/center-of-mass-explorer.js",
  "interaction-pair-explorer": "js/lesson-interactives/interaction-pair-explorer.js",
  "friction-explorer": "js/lesson-interactives/friction-explorer.js",
  "connected-systems-explorer": "js/lesson-interactives/connected-systems-explorer.js",
  "spring-graph-explorer": "js/lesson-interactives/spring-graph-explorer.js",
  "circular-motion-explorer": "js/lesson-interactives/circular-motion-explorer.js",
  "cart-force-mass": "simulations/cart-force-mass/index.js",
};

const STATIC_DIRS = ["css", "js", "assets", "data", "simulations"];

/**
 * Fill `{{TOKEN}}` placeholders from a map. Uses a replacer *function* so
 * a `$` in a value (KaTeX `$$…$$`, `$1`, `$&`) is inserted literally —
 * `String.replace(str, str)` would mangle those. Unknown tokens are left
 * as-is.
 */
function renderTemplate(tpl, map) {
  return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => (key in map ? map[key] : m));
}

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

function buildLesson(file, templates) {
  const relFromContent = path.relative(CONTENT_DIR, file);
  const lesson = JSON.parse(fs.readFileSync(file, "utf8"));

  const outRel = relFromContent.replace(/\.json$/, ".html");
  const outPath = path.join(DIST_DIR, outRel);
  const depth = outRel.split(path.sep).length - 1;
  const rootPrefix = depth > 0 ? "../".repeat(depth) : "./";

  // Tracked, independently validated HTML package. The JSON wrapper keeps
  // course registration and navigation in the common content architecture,
  // while preserving the approved form without a lossy schema conversion.
  // The source's own markup, CSS, and script are used verbatim — only
  // wrapped in the site header + theme (build/templates/external-html.html)
  // so it reads as part of Physics Academy instead of a bare document;
  // nothing about the approved instrument's questions or behavior changes.
  if (lesson.format === "external-html") {
    const sourcePath = path.join(ROOT, lesson.sourceFile || "");
    if (!fs.existsSync(sourcePath)) throw new Error(`${relFromContent}: missing external HTML source ${lesson.sourceFile}`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const source = fs.readFileSync(sourcePath, "utf8");
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(source);
    const styleMatch = /<style>([\s\S]*?)<\/style>/i.exec(source);
    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(source);
    if (titleMatch && bodyMatch) {
      // retarget a `body{...}` selector (top-level or inside @media) to the
      // card that now holds this content, so the source's own typesetting
      // governs the card rather than bleeding onto our page chrome.
      const style = (styleMatch ? styleMatch[1] : "").replace(/([{},]\s*|^\s*)body(\s*\{)/g, "$1.external-html-card$2");
      const html = renderTemplate(templates.externalHtml.replaceAll("{{ROOT}}", rootPrefix), {
        TITLE: esc((titleMatch[1] || lesson.lessonTitle || "").trim()),
        BREADCRUMB: [lesson.course, lesson.unit].filter(Boolean).map(esc).join(" › "),
        SOURCE_STYLE: style,
        SOURCE_BODY: bodyMatch[1],
      });
      fs.writeFileSync(outPath, html, "utf8");
    } else {
      // couldn't confidently extract title/style/body — ship the tracked
      // source byte-for-byte rather than risk mangling an approved page.
      console.warn(`[build] WARNING: ${relFromContent} — couldn't parse <title>/<body> for the site shell; copied verbatim (unthemed).`);
      fs.copyFileSync(sourcePath, outPath);
    }
    if (lesson.assetDirectory?.source && lesson.assetDirectory?.destination) {
      const assetSource = path.join(ROOT, lesson.assetDirectory.source);
      const assetTarget = path.resolve(path.dirname(outPath), lesson.assetDirectory.destination);
      if (!fs.existsSync(assetSource)) throw new Error(`${relFromContent}: missing external asset directory ${lesson.assetDirectory.source}`);
      fs.cpSync(assetSource, assetTarget, { recursive: true });
    }
    console.log(`[build] ${relFromContent} -> dist/${outRel} (external HTML package)`);
    return { ...lesson, outRel };
  }

  // Concept-inventory pages are not slide decks — a single form, score-only
  // feedback, questions and options shuffled at runtime (js/concept-inventory.js).
  // See docs/ap-physics-1-unit-2-architecture.md §10.
  if (lesson.format === "concept-inventory") {
    const html = renderTemplate(templates.conceptInventory.replaceAll("{{ROOT}}", rootPrefix), {
      TITLE: esc(lesson.lessonTitle || lesson.id),
      BREADCRUMB: [lesson.course, lesson.unit, "Concept Check"].filter(Boolean).map(esc).join(" › "),
      HEADING: esc(lesson.lessonTitle || "Concept Check"),
      INTRO: mdToHtml(lesson.intro || ""),
      CI_DATA_JSON: JSON.stringify({ diagnosticKey: lesson.diagnosticKey || lesson.id, items: lesson.items || [] }),
    });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`[build] ${relFromContent} -> dist/${outRel} (concept inventory)`);
    return { ...lesson, outRel };
  }

  // Unit index — an ordered map of the unit: concept-check (pre) →
  // modules in sequence → concept-check (post). Server-rendered, no JS.
  // See docs/ap-physics-1-unit-2-architecture.md §12.12.
  if (lesson.format === "unit-index") {
    const dir = path.dirname(outRel);
    // index and its modules sit in the same directory
    const linkFor = (slug) => `${slug}.html`;
    const items = (lesson.sequence || []).map((s) => {
      const built = s.slug && fs.existsSync(path.join(DIST_DIR, dir, s.slug + ".html"));
      const cls = ["unit-index__item", `is-${s.type}`, s.status ? `is-${s.status}` : "", built ? "" : "is-unbuilt"]
        .filter(Boolean).join(" ");
      const tag =
        s.type === "concept-check" ? `<span class="unit-index__phase">${esc(s.phase)}</span>`
        : `<span class="unit-index__label">${esc(s.label || "")}</span>`;
      const meta = [
        s.cluster ? `<span class="unit-index__cluster">${esc(s.cluster)}</span>` : "",
        s.status && s.status !== "reference" ? `<span class="unit-index__status">${esc(s.status)}</span>` : "",
        s.note ? `<span class="unit-index__note">${esc(s.note)}</span>` : "",
      ].filter(Boolean).join(" ");
      const title = esc(s.title || s.slug || "");
      const inner = built
        ? `<a href="${linkFor(s.slug)}">${title}</a>`
        : `<span class="unit-index__todo">${title}</span>`;
      return `    <li class="${cls}">${tag} ${inner} ${meta}</li>`;
    });
    const html = renderTemplate(templates.unitIndex.replaceAll("{{ROOT}}", rootPrefix), {
      TITLE: esc(lesson.lessonTitle || lesson.id),
      BREADCRUMB: [lesson.course, lesson.unit].filter(Boolean).map(esc).join(" › "),
      HEADING: esc(lesson.lessonTitle || lesson.unit || "Unit"),
      INTRO: mdToHtml(lesson.intro || ""),
      OUTCOMES: (lesson.outcomeClusters || []).length
        ? `<section class="unit-index__outcomes" aria-labelledby="learning-outcomes-heading">
    <h2 id="learning-outcomes-heading">Learning outcomes</h2>
    ${(lesson.outcomeClusters || []).map((cluster) => `<details class="unit-index__outcome-cluster card">
      <summary>${esc(cluster.title || "Outcome cluster")} <span>${(cluster.outcomes || []).length}</span></summary>
      ${mdToHtml((cluster.outcomes || []).map((outcome) => `- ${outcome}`).join("\n"))}
    </details>`).join("\n    ")}
  </section>`
        : "",
      SEQUENCE: items.join("\n"),
    });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`[build] ${relFromContent} -> dist/${outRel} (unit index)`);
    return { ...lesson, outRel };
  }

  const lessonTemplate = templates.lesson;
  const bank = loadQuestionBank(lesson);

  const plotlyScript = lesson.needsPlotly
    ? '<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>'
    : "";

  const componentScripts = [lesson.interactiveComponent?.componentKey, lesson.simulation?.componentKey]
    .filter(Boolean)
    .map((key) => COMPONENT_SCRIPTS[key])
    .filter(Boolean)
    .map((src) => `<script src="${rootPrefix}${src}"></script>`)
    .join("\n");

  const lessonLabel = lesson.lessonNumber
    ? `Lesson ${lesson.lessonNumber} — ${lesson.lessonTitle}`
    : lesson.lessonTitle;

  // the unit-index page for this lesson's unit is the sibling *-index.json;
  // linkify the breadcrumb so the sidebar doubles as repo navigation.
  const siblingIndex = fs
    .readdirSync(path.dirname(file))
    .find((f) => f.endsWith("-index.json"));
  const crumbs = [
    { label: lesson.course, href: `${rootPrefix}index.html` },
    { label: lesson.unit, href: siblingIndex ? siblingIndex.replace(/\.json$/, ".html") : null },
    { label: lessonLabel },
  ];
  const breadcrumb = crumbs
    .filter((c) => c.label)
    .map((c, i, arr) =>
      c.href && i < arr.length - 1 ? `<a href="${attr(c.href)}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`
    )
    .join(' <span class="breadcrumb__sep" aria-hidden="true">›</span> ');

  const html = renderTemplate(lessonTemplate.replaceAll("{{ROOT}}", rootPrefix), {
    TITLE: esc(lessonLabel || lesson.id),
    BREADCRUMB: breadcrumb,
    SIDEBAR_TOC: renderSidebarToc(lesson, bank),
    LESSON_BODY: renderLessonBody(lesson, bank),
    LESSON_DATA_JSON: JSON.stringify(lesson),
    PLOTLY_SCRIPT: plotlyScript,
    COMPONENT_SCRIPTS: componentScripts,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`[build] ${relFromContent} -> dist/${outRel}`);
  return { ...lesson, outRel };
}

function buildHomepage(lessons) {
  const homepageTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, "homepage.html"), "utf8");
  const byCourse = {};
  for (const l of lessons) (byCourse[l.course] = byCourse[l.course] || []).push(l);

  const label = (l) =>
    l.format === "concept-inventory"
      ? `${l.lessonTitle} (concept check)`
      : l.lessonNumber
        ? `Lesson ${l.lessonNumber} — ${l.lessonTitle}`
        : l.lessonTitle;

  // "Unit 2: Kinematics" -> 2. Units render in this numeric order, not the
  // order the file walk happened to first meet them (which depends on
  // which unit had a built lesson lowest in alpha order — see the 2026-09
  // BASIS Physics 8 integration, where "Unit 2" briefly rendered before
  // "Unit 1" on the homepage for exactly this reason).
  const unitNumber = (unit) => {
    const m = /Unit\s+(\d+)/i.exec(unit || "");
    return m ? Number(m[1]) : Infinity;
  };

  const courseList = Object.entries(byCourse)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([course, ls]) => {
      // group by unit; a unit-index page, if present, heads its unit
      const byUnit = {};
      for (const l of ls) (byUnit[l.unit || ""] = byUnit[l.unit || ""] || []).push(l);
      const units = Object.entries(byUnit)
        .sort(([a], [b]) => unitNumber(a) - unitNumber(b) || a.localeCompare(b))
        .map(([unit, us]) => {
          const idx = us.find((u) => u.format === "unit-index");
          const rest = us
            .filter((u) => u.format !== "unit-index")
            .sort((a, b) => {
              // concept check first, then by lesson number
              const rank = (x) => (x.format === "concept-inventory" ? -1 : parseFloat(x.lessonNumber) || 99);
              return rank(a) - rank(b);
            });
          const heading = idx
            ? `<h4><a href="${esc(idx.outRel)}">${esc(unit || idx.lessonTitle)}</a></h4>`
            : unit
              ? `<h4>${esc(unit)}</h4>`
              : "";
          return `${heading}
      <ul>
        ${rest.map((l) => `<li><a href="${esc(l.outRel)}">${esc(label(l))}</a></li>`).join("\n        ")}
      </ul>`;
        })
        .join("\n");
      return `
    <h3>${esc(course)}</h3>
    ${units}`;
    })
    .join("\n");

  const html = renderTemplate(homepageTemplate, {
    COURSE_LIST: courseList || "<p>No lessons built yet.</p>",
  });
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), html, "utf8");
}

function runValidation() {
  const taxonomies = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "taxonomies.json"), "utf8")
  );
  const { errors, warnings } = validateContent({ taxonomies });
  for (const w of warnings) console.warn(`[validate] WARNING ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`[validate] ERROR   ${e}`);
    console.error(`\n[validate] ${errors.length} error(s) — build aborted. Fix the content or update data/taxonomies.json.`);
    process.exit(1);
  }
  console.log(`[validate] content OK (${warnings.length} warning(s))`);
}

function build() {
  runValidation();

  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Tell GitHub Pages not to run Jekyll over the output (harmless elsewhere).
  fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "");

  // If a custom domain is configured (physics-repository/CNAME), carry it
  // into the published artifact so a "GitHub Actions" Pages deploy keeps
  // the domain. Optional — no file, no CNAME.
  const cnameSrc = path.join(ROOT, "CNAME");
  if (fs.existsSync(cnameSrc)) fs.copyFileSync(cnameSrc, path.join(DIST_DIR, "CNAME"));

  copyStaticDirs();

  const templates = {
    lesson: fs.readFileSync(path.join(TEMPLATES_DIR, "lesson.html"), "utf8"),
    conceptInventory: fs.readFileSync(path.join(TEMPLATES_DIR, "concept-inventory.html"), "utf8"),
    unitIndex: fs.readFileSync(path.join(TEMPLATES_DIR, "unit-index.html"), "utf8"),
    externalHtml: fs.readFileSync(path.join(TEMPLATES_DIR, "external-html.html"), "utf8"),
  };
  // Build unit-index files last: they check which module pages actually
  // got emitted into dist/.
  const lessonFiles = findLessonFiles(CONTENT_DIR).sort((a, b) => {
    const ai = a.includes("-index.json") ? 1 : 0;
    const bi = b.includes("-index.json") ? 1 : 0;
    return ai - bi || a.localeCompare(b);
  });
  const builtLessons = lessonFiles.map((file) => buildLesson(file, templates));

  buildHomepage(builtLessons);
  console.log(`[build] Done. ${builtLessons.length} lesson page(s) built.`);
}

build();
