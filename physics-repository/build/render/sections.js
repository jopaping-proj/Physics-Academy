/**
 * Slide-section components. Each `*Slides()` function turns one part of
 * the lesson JSON into an array of slide descriptors
 * `{ id, group, groupLabel, subtitle?, cls?, componentKey?, body }`.
 * `collectSlideSpecs()` is the single ordered source both the page body
 * (`renderLessonBody`) and the sidebar (`renderSidebarToc`) are built
 * from. The <section> shell is added by wrapSlide() (primitives.js).
 *
 * The component inventory these map to is catalogued in
 * docs/architecture-proposal.md §4.
 */
import fs from "node:fs";
import path from "node:path";
import { mdInline, mdToHtml } from "../../js/markdown.js";
import { groupByLessonTier } from "../../js/difficulty.js";
import { QUESTION_BANK_DIR } from "./paths.js";
import { esc, attr, wrapSlide, renderFigures, renderFormativeCheck } from "./primitives.js";
import { renderWorkedExample } from "./worked-example.js";

// ---- HookCard (§5) ----
export function hookSlides(hook) {
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

// ---- ObjectiveList (§6) ----
export function objectivesSlides(lesson) {
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

export function priorKnowledgeSlides(md) {
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

// ---- ConceptChunk (§7) — one chunk becomes up to four cards ----
export function chunkSlides(chunk, index) {
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

// ---- FormulaExplorer / GraphExplorer container (§12–13) ----
export function interactiveComponentSlides(ic) {
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
      groupLabel: ic.title || formatComponentTitle(ic.type) || "Explore",
      subtitle: ic.subtitle || "Work it, don't just watch it",
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

// ---- SimulationContainer (§14) ----
export function simulationSlides(sim) {
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

// ---- MisconceptionCard (§17) — each renders as a real MCQ, one per card ----
export function misconceptionSlides(list) {
  if (!list || !list.length) return [];
  return list.map((m, i) => ({
    id: `misconception-${i}`,
    group: "miscon",
    groupLabel: "Common Misconceptions",
    subtitle: `${i + 1} of ${list.length} — answer, then read why every option is right or wrong`,
    body: renderFormativeCheck(m, `misconception-${i}`),
  }));
}

// ---- ErrorAnalysisCard (rigor-standard-addendum.md §13) ----
export function errorAnalysisSlides(list) {
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

export function representationConnectionsSlides(md) {
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

export function lessonAssessmentSlides(questions) {
  if (!questions || !questions.length) return [];
  return questions.map((q, i) => ({
    id: `lesson-${i}`,
    group: "check",
    groupLabel: "Lesson Check",
    subtitle: `Question ${i + 1} of ${questions.length}`,
    body: renderFormativeCheck(q, `lesson-${i}`),
  }));
}

// ---- ExamConnectionCard (course-neutral; §18–19) ----
export function examConnectionSlides(md) {
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

export function summarySlides(md) {
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

export function exitQuestionSlides(q) {
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

export function loadQuestionBank(lesson) {
  if (!lesson.questionBankFile) return [];
  const bankPath = path.join(QUESTION_BANK_DIR, lesson.questionBankFile);
  if (!fs.existsSync(bankPath)) {
    console.warn(`[build] WARNING: question bank file not found: ${lesson.questionBankFile}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(bankPath, "utf8"));
}

// ---- Further Practice — one card per rigor §3 tier ----
export function furtherPracticeSlides(lesson, bank) {
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

// ---------- assembly ----------

/** The ordered slide descriptors for a lesson — the single source both
 * the page body and the sidebar TOC are built from. */
export function collectSlideSpecs(lesson, bank) {
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

export function renderLessonBody(lesson, bank) {
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
export function renderSidebarToc(lesson, bank) {
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
