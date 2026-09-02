# BASIS Physics 8 — Course Architecture

**Document ID:** PA-BP8-ARCH-001
**Version:** 0.1.0
**Status:** Draft — for review. Not the controlled BASIS Physics 8 authority.
**Scope:** the structural map for the BASIS Physics 8 course inside Physics Academy — unit list, outcome-source provenance, lesson format, test-bank provenance, and what is and is not built. It is deliberately lighter than `ap-physics-1-unit-2-architecture.md`: BASIS Physics 8 reuses the AP build, template, validator, and interactive scaffolding rather than redefining them.

---

## 0. Relationship to the AP Physics 1 build

BASIS Physics 8 is a **second course** in the same repository. It shares, unchanged:

- the Node build (`node build/build.js`, `content/**/*.json` → `dist/`) and the `build/validate.js` gate;
- the slide-deck lesson template (`build/templates/lesson.html`, `js/lesson-slides.js`), the unit-index template, and the concept-inventory template;
- the free-body-diagram SVG pipeline (`build/gen-diagrams.js`, `build/render/fbd-svg.js`) and the shared interactive scaffold (`js/interactive-panel.js`, `window.PA.panel`);
- the controlled vocabularies in `data/taxonomies.json` — `courses` includes `"basis-physics-8"`; `skill`, `representation`, `cognitiveLevel`, `difficulty`, and `misconception` slugs are shared.

Course separation is by the `courses` array on every lesson, question, and unit index (`["basis-physics-8"]`). The homepage groups by course (alphabetical) then unit (by parsed "Unit N").

**Not adopted (by design):** the `objective` / `cedTopic` scheme. That validator check is now structural and unit-generic (`C<unit>.<cluster>` paired with a same-unit `<unit>.<topic>`), so BASIS Physics 8 *could* adopt it per unit, but has not — `objective` is optional. BASIS clusters use the form `BP8.<unit>.<n>` in the unit indexes for human reference only.

---

## 1. Outcome-source provenance

Every BASIS Physics 8 learning outcome comes **only** from the Markdown files under `resources/physics8/resources/` (one `unit<N>_*_outcomes.md` per unit). The Numbers course outline supplies the Unit 1 *title* only; it is **not** an outcomes source. No outcome is authored inline — the unit index `source` field names the Markdown file it was transcribed from, and `outcomeClusters` holds the transcription.

`resources/physics8/rescue_sprint/` holds the Founder-approved lesson-content Markdown (e.g. the Unit 2 kinematics modules); a lesson JSON's `sourceDocument` + `sourceApproval` fields cite the specific file and approval (e.g. "Founder-approved under DEC-040").

---

## 2. Unit map

| Unit | Title | Outcome source | Unit index | Built lessons |
|---|---|---|---|---|
| 1 | Graphing and Dimensional Analysis | placeholder (title from the Numbers outline) | `unit-1-index.json` | none |
| 2 | Kinematics | `resources/physics8/resources/unit2_kinematics_outcomes.md` (27 outcomes / 7 clusters) | `unit-2-index.json` | **Lesson 1** — Motion Language and Reference Frames (`motion-language-reference-frames.json`, **approved**); entry diagnostic (`format: "external-html"`, Founder-approved, **approved**) |
| 3 | Forces and Newton's Laws | `resources/physics8/resources/` | `unit-3-index.json` | none |
| 4 | Energy | `resources/physics8/resources/` | `unit-4-index.json` | none |
| 5 | Thermal Physics | `resources/physics8/resources/` | `unit-5-index.json` | none |
| 6 | Momentum and Collisions | `resources/physics8/resources/` | `unit-6-index.json` | none |
| 7 | Waves and Light | `resources/physics8/resources/` | `unit-7-index.json` | none |
| 8 | Electric Current and Circuits | `resources/physics8/resources/` | `unit-8-index.json` | none |

Every unit index is `format: "unit-index"` and orders concept-check (pre) → modules → concept-check (post), the same as AP. A module's `slug` is `null` until a native interactive page is built; a non-null slug is the signal that the page exists.

---

## 3. Lesson format

BASIS Physics 8 lessons are the **same JSON schema** as AP lessons (see the schema comment at the top of `build/build.js`), delivered as slide decks. A built lesson carries: `hook`, `majorObjective` + `subObjectives`, `chunks` (each with `concept`, optional `representation`, `conceptFigures`, `workedExample` with subgoal `phases`, and a `formativeCheck`), `misconceptions`, `representationConnections`, `lessonAssessment`, `examConnection`, `summary`, `exitQuestion`. Plus BASIS-specific provenance: `sourceDocument`, `sourceApproval`.

**Progressive disclosure:** every question-type item (`formativeCheck`, `misconceptions[]`, `lessonAssessment[]`, `exitQuestion`) should carry `hint` (array of strings, revealed one at a time) and `solution` (string), the same as AP — these drive `js/assessment.js` `renderProgressiveDisclosure`. Added to Lesson 1 in v0.9.13 of the AP architecture changelog; any further BASIS lesson must include them.

**External-HTML lessons:** a tracked, Founder-approved HTML page (the Unit 2 entry diagnostic) is `format: "external-html"` — the build extracts its `<title>` / `<style>` / `<body>`, retargets the `body{}` selector to `.external-html-card`, and wraps it in the site header + dark shell via `build/templates/external-html.html`. Questions, JS, and self-scoring are untouched; only presentation is themed.

---

## 4. Test-bank provenance

`data/question-bank/basis-p8-test-bank-index.json` and the per-unit `basis-p8-u<N>-*-index.json` files are **provenance manifests**, not native question arrays. They record the recalibrated inventory of the approved/proposed Markdown source banks (Units 2–4: 900 active + 29 retired Unit 4 records, `BP8-*` namespace) so the Markdown banks are preserved and auditable. They do **not** claim native interactive-question conversion — converting them to the native schema (as `ap1-u2-*.json` are) is future work, tracked below.

---

## 5. Open items

1. **Native question banks.** The `BP8-*` manifests are ledgers over Markdown. Converting even one unit to native `courses`-tagged question arrays (the AP shape) would let BASIS lessons pull `furtherPracticeQuestionIds` the way AP lessons do. Large; deferred.
2. **Unit 1 outcome source.** Unit 1 has only a placeholder title. It needs a real `unit1_*_outcomes.md` before any Unit 1 lesson is built.
3. **Second built lesson.** Only Lesson 1 (Unit 2) is built. Lesson 2 (Position–Time Graphs) is the natural next one and would exercise the graph-figure path.
4. **BASIS diagnostic progressive disclosure.** The entry diagnostic is an external-HTML page with its own self-test; it does not use the native hint/solution disclosure and is not expected to.

---

## 6. Revision history

| Version | Date | Status | Summary |
|---|---|---|---|
| 0.1.0 | 2026-09-02 | Draft — for review | Initial lightweight architecture doc. Consolidates what the parallel BASIS Physics 8 effort produced: 8 unit indexes (outcomes sourced only from `resources/physics8/resources/`), Lesson 1 of Unit 2 built and Founder-approved, the Unit 2 entry diagnostic as a themed `external-html` page, and the `BP8-*` test-bank provenance manifests (900 active records, Units 2–4). Records that BASIS Physics 8 reuses the AP build/template/validator/interactive scaffolding unchanged and does not adopt the `objective`/`cedTopic` scheme. Progressive-disclosure `hint`/`solution` added to all five Lesson 1 question items in the same pass. |
