# Test generation

**Document ID:** PA-TESTGEN-001
**Version:** 1.0.0 · 2026-09-02
**Status:** Draft — for review.

How Physics Academy builds a randomized practice test, and the single
difficulty distribution every test in every course is built to.

---

## 1. What we adopted, and from where

`resources/physics8/test_generator/` (the BASIS Physics 8 rescue-sprint
tool) was reviewed. Its **algorithms** are sound and were reused:

- a seeded **mulberry32** RNG, Fisher–Yates shuffle, sample-without-replacement;
- **largest-remainder stratified sampling** by difficulty;
- MCQ **option shuffle with answer remap**.

What did **not** carry over: it is bound to that project's Markdown item
banks and a bespoke parser, it is a standalone CLI that emits static
Markdown, and it has no time-budget mode, no calculator policy, and no
verified difficulty target. Physics Academy question banks are native
JSON arrays with a rich schema, and tests are delivered **in the browser**
as part of the site build. So the logic was rebuilt here:

| Piece | Where |
|---|---|
| Canonical distribution + timing + calculator defaults | `data/test-blueprint.json` |
| Assembly-time pool build + blueprint adequacy check | `build/render/unit-test.js` |
| Page shell | `build/templates/unit-test.html` |
| Attempt-time draw, timer, scoring, review | `js/unit-test.js` |
| Per-unit test content file | `content/**/<unit>-test.json` (`"format": "unit-test"`) |

The **draw happens at attempt time**, in the browser, from a fresh seed
every visit — so every sitting is a different set of questions in a
different order with the options shuffled, with no backend
(`master-project-prompt.md` §25/§30).

---

## 2. The blueprint — `data/test-blueprint.json`

One file. Every generated test in every course is built to it, and it is
the **authoring target for the question banks**: a unit's bank should
hold enough items in each difficulty band to let a 45-minute test be
drawn to this shape.

### 2.1 Section split — 50 / 50 by points

An MCQ is worth 1 point; an FRQ is worth its `totalPoints`. The test
targets **half its points from each section**.

- **AP Physics 1 (2025):** the exam is exactly 50 % multiple-choice /
  50 % free-response.
- **IB Physics (2025 syllabus):** leans to constructed response
  (Paper 1A multiple choice is a smaller slice), but a 50/50 *practice*
  split trains both the fast-recognition and the extended-argument
  skills a 90 %+ student needs, so we standardise on 50/50.

### 2.2 Difficulty distribution — deliberately above the exam

Target share of items at each `data/taxonomies.json` difficulty level:

| Level | Target | A real exam (mapped to this scale) |
|---|--:|--:|
| `foundation` | 10 % | ~15 % |
| `developing` | 20 % | ~25 % |
| `ap-ib-standard` | 35 % | ~35 % |
| `ap5-ib7-target` | 25 % | ~20 % |
| `distinction-stretch` | 10 % | ~5 % |

**Why train above the exam.** The score that earns a **5** on AP
Physics 1 or a **7** on IB Physics is roughly **65–75 %** of the
available marks, not 90 %+. A student who is comfortable at that level is
*not* comfortable at 90 %. The practice test therefore sits a band
harder than the real thing — the median item is `ap-ib-standard` and
**35 % of items are at or above the AP-5 / IB-7 line** (vs ~25 % on a
live paper). Clearing this test comfortably means the real exam has
slack in it. This is the "desirable difficulty" principle (Bjork &
Bjork): practice that is harder than the criterion task produces better
performance on the criterion task.

### 2.3 Cognitive distribution

Target share by cognitive band; bands group the 8-level `cognitiveLevel`
scale in `rigor-standard-addendum.md` §2:

| Band | Levels | Target |
|---|---|--:|
| Recall + Direct application | 1–2 | 25 % |
| Conceptual + Multi-representation reasoning | 3–4 | 40 % |
| Modeling, Transfer, Synthesis, Evaluation | 5–8 | 35 % |

AP Physics 1 and IB Physics are reasoning-first exams — the AP science
practices and the IB assessment objectives are dominated by application,
analysis and evaluation — so the top band is intentionally large. (The
attempt-time sampler currently stratifies on **difficulty**; the
cognitive shares are an authoring and review target, checked when a
bank is built, not enforced per draw.)

### 2.4 Timing (time-budget mode)

| Constant | Value | Basis |
|---|--:|---|
| `mcqMinutes` | 2.0 | AP Physics 1 2025: 80 min / 40 MCQ |
| `frqMinutesPerPoint` | 0.8 | scaled down from AP (100 min / 4 × 15-pt FRQ ≈ 1.6/pt); our FRQs are shorter |
| `frqMinutesOverhead` | 1.5 | per-FRQ read-and-set-up cost |

A 45-minute test comes out at roughly **15 MCQ + 2 FRQ** (≈ 42 min of
work, leaving buffer).

### 2.5 Calculator policy

`calculatorPolicyByCourse` sets the default for a test's MCQ section.
When `"not-allowed"`:

- `js/unit-test.js` shows a no-calculator banner;
- `build/render/unit-test.js` draws the MCQ pool **only** from items
  flagged `"calculatorFree": true` (and warns if that thins the pool).

**Current defaults:** AP → `allowed`; **IB SL/HL → `not-allowed`**;
BASIS Physics 8 → `not-allowed`.

> ⚠️ **Syllabus note.** The **current IB Physics syllabus (first exams
> 2025) permits a calculator on Paper 1A** — the no-calculator Paper 1 was
> the *pre-2025* syllabus. The `not-allowed` default for IB here follows
> the project owner's directive that DP multiple-choice practice be
> doable by hand; flip `ib-physics-sl` / `ib-physics-hl` to `allowed` in
> `data/test-blueprint.json` (or set `calculatorPolicy` on the test file)
> to match the 2025 syllabus. Either way the mechanism is one word.

---

## 3. The per-unit unit test

Every unit in every course gets **one** `format: "unit-test"` content
file. Delivered as its own page, listed last in the unit index.

```json
{
  "format": "unit-test",
  "id": "ap1-u2-unit-test",
  "slug": "unit-2-test",
  "course": "AP Physics 1",
  "courses": ["ap-physics-1"],
  "unit": "Unit 2: Force and Translational Dynamics",
  "lessonTitle": "Unit 2 Test",
  "intro": "md…",
  "config": { "mode": "time", "minutes": 45 },
  "calculatorPolicy": "allowed",
  "mcqBanks": ["ap1-u2-dynamics.json", "…"],
  "frqBanks": ["ap1-u2-dynamics-frq.json"]
}
```

- **`config`** — `{ "mode": "time", "minutes": N }` derives the item
  counts from the timing constants; `{ "mode": "count", "mcq": N, "frq": M }`
  sets them explicitly. This is the "customisable by time limit **or**
  by number of items" control.
- **`calculatorPolicy`** (optional) overrides the course default.
- **`mcqBanks` / `frqBanks`** — the question-bank files (in
  `data/question-bank/`) whose items form the candidate pool. List every
  bank in the unit; items reused across lessons are de-duped by `id`.

### Behaviour at attempt time (`js/unit-test.js`)

1. Fresh seed on every page load.
2. Item counts from `config` (+ timing constants).
3. **Stratified sample** by difficulty against the blueprint (largest
   remainder; backfills from the pool if a bucket is short).
4. Shuffle the question order; shuffle each MCQ's options and remap the
   answer.
5. Countdown timer; **auto-submits at 0:00**.
6. MCQ scored automatically with per-option feedback shown on review;
   FRQ **self-scored** against the model answer and rubric (a points
   input per FRQ).
7. Composite % = `pointSplit.mcq · mcqPct + pointSplit.frq · frqPct`,
   shown against the pass mark (60 %) and target mark (90 %).
8. Each attempt `{ pct, mcqPct, frqPct, durationSec, at, seed }` is
   stored in `localStorage` under `pa:ut:<id>` (best score shown on the
   cover).

---

## 4. Using the blueprint to build a bank

When authoring a unit's question bank, aim for a pool that can be drawn
to §2.2 and §2.3 for a 45-minute test — in practice **≥ 25 MCQ** spread
across all five difficulty levels (not clustered at `ap-ib-standard`),
plus **≥ 3 FRQ**. `build/render/unit-test.js` prints a build warning when
a unit's MCQ pool is thin at a difficulty level relative to the target,
or has fewer than ~15 items total. Treat those warnings as a bank-gap
checklist.

For **IB courses**, every MCQ that could appear on a `not-allowed` test
needs `"calculatorFree": true` and must be answerable by hand (clean
numbers, ratio reasoning, no multi-step arithmetic).

---

## 5. Sources

- AP Physics 1 exam format & scoring (40 MCQ / 80 min; 4 FRQ / 100 min;
  50/50; ~70 % composite for a 5): AP Central —
  <https://apcentral.collegeboard.org/courses/ap-physics-1/exam> ; UWorld
  AP Physics 1 score guide —
  <https://collegeprep.uworld.com/ap/ap-physics-1/score-guide/>
- IB Physics 2025 syllabus — Paper 1A (SL 30 / HL 40 MCQ) + Paper 1B,
  Paper 2; calculator permitted on all papers; Paper 1 36 % / Paper 2
  44 %: Concordian International School LibGuide (IBDP Physics 2025) —
  <https://concordian-thailand.libguides.com/c.php?g=959709&p=6967629> ;
  Clastify, *IB Physics Paper 1* — <https://www.clastify.com/blog/ib-physics-paper-1>
- Desirable difficulty (practice harder than the criterion task improves
  criterion performance): Bjork & Bjork, "Making things hard on yourself,
  but in a good way" (2011).

---

## 6. Revision history

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-09-02 | Initial. Reviewed `resources/physics8/test_generator`; rebuilt the logic for native JSON banks + in-browser delivery. `data/test-blueprint.json` (50/50 point split; difficulty distribution a band above the exam; cognitive bands; AP-2025 timing; calculator policy by course with the IB-2025 syllabus caveat). `format: "unit-test"` pages via `build/render/unit-test.js` + `build/templates/unit-test.html` + `js/unit-test.js`. Reference: AP Physics 1 Unit 2 (`content/ap-physics-1/unit-2-dynamics/unit-2-test.json`). |
