# Question banks — the topic-keyed model

**Document ID:** PA-QBANK-TOPICS-001
**Version:** 0.1.0 · 2026-09-03
**Status:** Draft — for review. Introduces `topicId` and the first shared bank (`kinematics-1d`).

---

## 1. Why topic-keyed

Physics Academy teaches the same physics in three places at different depths:
BASIS Physics 8 (pre-AP), AP Physics 1 / 2, and IB Physics SL / HL. The unit
*numbers* differ per course (BASIS Unit 2 Kinematics ≈ AP Physics 1 Unit 1 ≈ IB
"Kinematics" under Theme A), but the *items* — a position–time graph read, a
`\Delta v = a\,\Delta t` calculation, a vector decomposition — are the same
physics. Maintaining a separate bank per course-unit means writing the same
item three times and letting the three copies drift.

Every native bank item already carries a `courses: [...]` array, and the build
already separates courses by that tag. The only thing missing was a **stable
physics-topic key** so one file can serve every course that teaches that topic.
That key is `topicId`.

## 2. `topicId`

A lowercase, hyphenated slug naming a coherent teaching topic, **independent of
any course's unit numbering**. It is a **controlled vocabulary**: the valid
values, their bank files, and their eligible courses live in
**`data/question-bank-topics.json`**, and `build/validate.js` fails the build if
a bank item carries an unknown `topicId` or lists a `course` the topic has not
declared (in `courses` or `plannedCourses`). It is kept out of
`data/taxonomies.json` deliberately — it is bank-specific, not a general
item taxonomy. One `topicId` maps to exactly one shared bank file pair
(`<topicId>.json` for MCQ, `<topicId>-frq.json` for FRQ).

### Registry

`data/question-bank-topics.json` is the source of truth; this table mirrors it.
`courses` = drawn from today; `plannedCourses` = pre-declared so the validator
permits the eventual cross-tag (move a slug from `plannedCourses` to `courses`
when the target course's unit is built and reviewed).

| `topicId` | Bank files | `courses` (live) | `plannedCourses` | Notes |
|---|---|---|---|---|
| `kinematics-1d` | `kinematics-1d.json`, `kinematics-1d-frq.json` | `basis-physics-8` | `ap-physics-1`, `ib-physics-sl`, `ib-physics-hl` | One-dimensional motion only: motion language, `x`/`v`/`a`–`t` graphs, constant-acceleration equations, 1-D free fall, vector components / SOHCAHTOA. **No** projectile motion, force-based reasoning, or calculus. 250 MCQ + 50 FRQ from the Founder-approved BASIS Unit 2 test bank. |
| `forces-and-newtons-laws` | `forces-and-newtons-laws.json`, `forces-and-newtons-laws-frq.json` | `basis-physics-8` | `ap-physics-1` | Gravity, inertia / Newton's first law, force identification and free-body diagrams, equilibrium, Newton's second law, inclined planes (with/without friction), Newton's third law, Hooke's law. 1-D net-force reasoning and simple inclines — the **pre-AP subset of `newtonian-dynamics`**. 250 MCQ + 50 FRQ from `resources/physics8/rescue_sprint/unit_03_forces/test_bank/`. The 10 universal-gravitation numerical MCQs are `calculatorFree: false`. |
| `newtonian-dynamics` | the 17 `ap1-u2-*.json` files (see the registry) | `ap-physics-1` | `ap-physics-2`, `ib-physics-sl`, `ib-physics-hl` | Systems and centre of mass, free-body diagrams, Newton's three laws, static/kinetic friction, connected objects and pulleys, inclined planes with 2-D component resolution, gravitation / springs / apparent weight, uniform circular motion. The full AP Physics 1 Unit 2 (Force and Translational Dynamics) scope — a **superset** of `forces-and-newtons-laws`. 180 items; migrated onto `topicId` 2026-09-03 (`build/migrations/2026-09-03-ap1-u2-topicid/`). |
| `mechanical-energy` | `mechanical-energy.json`, `mechanical-energy-frq.json` | `basis-physics-8` | `ap-physics-1` | Work ($W = Fd$ at $0^\circ$/$90^\circ$/$180^\circ$), total and mechanical energy, gravitational PE ($mgh$), kinetic energy ($\tfrac12 mv^2$), conservation of mechanical energy, spring PE ($\tfrac12 kx^2$), work-energy theorem. Scalar energy accounting; no 2-D work or power. 250 MCQ + 50 FRQ from `resources/physics8/rescue_sprint/unit_04_energy/test_bank/`. |
| `thermal-physics` | `thermal-physics.json`, `thermal-physics-frq.json` | `basis-physics-8` | `ap-physics-2`, `ib-physics-sl`, `ib-physics-hl` | Temperature as average particle KE; C/K/F scales ($T_K = T_C + 273$); internal energy; thermal equilibrium and the zeroth law; heat; conduction / convection / radiation; specific heat capacity ($Q = mc\Delta T$); latent heat ($Q = mL$); calorimetry; heating curves. No ideal-gas law or entropy. **First hand-authored bank** (no `rescue_sprint` source exists for Unit 5) — 54 MCQ (all `calculatorFree`) + 14 FRQ, calibrated against Tsokos IB Topic 3 and OpenStax HS Physics Ch. 11. Tranche 1. |

The AP Physics 1 Unit 2 banks (`ap1-u2-*.json`) were migrated onto `topicId`
(`newtonian-dynamics`) on 2026-09-03 — an additive one-line insert per item, no
content or formatting change. New banks
use the topic-keyed model.

## 3. Item schema additions

On top of the standard question schema (`build/build.js` schema comment):

```jsonc
{
  "id": "BP8-U2-MCQ-021",          // keep the source provenance id
  "sourceId": "U2-MCQ-021",        // id in the resource bank it was converted from
  "courses": ["basis-physics-8"],  // every course this item is in-scope for TODAY
  "topicId": "kinematics-1d",
  "cluster": "position_time_graphs",   // sub-topic, from the source bank
  "sourceOutcomes": ["P1", "P3"],      // source-bank outcome codes (reference only)
  "calculatorFree": true,          // REQUIRED true for any item that may appear on a
                                   // no-calculator test (IB Paper 1, BASIS) — see §5
  // ... skill, representation, difficulty, cognitiveLevel, question, choices,
  //     correctAnswer, feedback, hint, solution  (unchanged)
}
```

`courses` means **"valid and in-scope for a test in this course right now"**, not
"could conceivably be adapted for". A 1-D-only kinematics item is tagged
`basis-physics-8` today; it will be added to `ap-physics-1` only when the AP
Physics 1 kinematics unit is built and a reviewer confirms the 1-D pool is a
sensible *part* of that unit's test (an AP kinematics test also needs 2-D /
projectile items, which this topic deliberately excludes).

## 4. Difficulty mapping (source 3-band → Physics Academy 5-band)

The BASIS resource bank tags items `Moderate` / `Challenging` / `High challenge`.
Conversion maps them to `data/test-blueprint.json`'s five bands:

| Source | → Physics Academy | Rule |
|---|---|---|
| Moderate | `foundation` | pure single-step identification (scalar/vector naming, one-shot component read), no misconception, no argument |
| Moderate | `developing` | everything else Moderate |
| Challenging | `ap-ib-standard` | default |
| Challenging | `ap5-ib7-target` | "evaluate this claim" / multi-step argument framing |
| High challenge | `ap5-ib7-target` | default |
| High challenge | `distinction-stretch` | argument / evaluation / synthesis framing |

`cognitiveLevel` (1–8) is assigned from difficulty + whether a named
misconception must be actively rejected + whether the item is an
argument-evaluation.

## 5. Calculator policy

`data/test-blueprint.json` → `calculatorPolicyByCourse` is `not-allowed` for
`basis-physics-8` and both IB courses. `build/render/unit-test.js` then filters
the MCQ pool to `calculatorFree: true` only. Conversion sets `calculatorFree`
per item:

- **false** when solving requires a real calculator: `\tan^{-1}` / `\cos^{-1}` /
  `\sin^{-1}` of a non-standard angle, or `\sqrt` of a non-perfect-square.
- **true** otherwise — including Pythagorean triples, the 37°/53° classroom
  convention (`\sin 37^\circ = 0.60`, `\cos 37^\circ = 0.80`, prepended to the
  stem during conversion), and all clean integer arithmetic.

Items marked `calculatorFree: false` stay in the bank (for lessons and for
future calculator-permitted contexts); they are simply not drawn for a
no-calculator test.

## 6. Conversion workflow (for the next topic)

1. Parse the source Markdown bank into structured items (see the
   `kinematics-1d` conversion scripts kept in the session scratchpad; the
   parser keys on `### <ID>`, `**Field:**` lines, `A.`–`D.` options, and the
   `**Rationale**` bullet list).
2. Enrich: map difficulty, assign `skill` / `representation` / `cognitiveLevel`,
   build `feedback.correct` + `feedback.incorrect.<i>` from the rationale
   bullets, synthesise a `hint`, lift `solution` from the "Correct (X)" bullet,
   compute `calculatorFree`.
3. Convert `\( \)` → `$ $`, `\degree` → `^\circ`; leave bare `°` (renders in
   prose).
4. Write `data/question-bank/<topicId>.json` and `<topicId>-frq.json`.
5. Transfer + restyle any referenced SVG assets into
   `assets/diagrams/<course>/<unit>/<topic>-bank/` (verify §11 label clearance).
6. `node build/build.js` — the validator gates every item; the unit-test
   assembler warns on thin difficulty buckets.

## 7. Status of `kinematics-1d`

**Complete: 250 MCQ + 50 FRQ** — the whole source bank, all 7 clusters.
**234 of the 250 MCQ are `calculatorFree`**; 89 items (74 MCQ + 15 FRQ) carry a
figure. The 24 source graph/vector SVGs were transferred and restyled into
`assets/diagrams/basis-physics-8/unit-2/kinematics-bank/` (light-touch: gridline
and text colours normalised to the house palette, fonts unified; the source's
Playwright-verified layouts were kept). Powers the BASIS Physics 8 Unit 2 test
(`content/basis-physics-8/unit-2-kinematics/unit-2-test.json`) and the
`furtherPracticeQuestionIds` of Unit 2 Lessons 1–3.

Difficulty spread (MCQ): foundation ~2%, developing ~33%, ap-ib-standard ~38%,
ap5-ib7-target ~24%, distinction-stretch ~2% — within blueprint tolerance; the
runtime sampler backfills the thin `foundation` / `distinction-stretch` buckets
for a 15-item draw.

**Done:** `topicId` is now a controlled vocabulary (`data/question-bank-topics.json`
+ `build/validate.js` check).

**Not started:** independent physics review of the auto-assigned tags and
synthesised hints; the actual cross-tag to AP/IB (deferred by owner decision
until each target course's unit is built — the registry's `plannedCourses`
holds the intent).
