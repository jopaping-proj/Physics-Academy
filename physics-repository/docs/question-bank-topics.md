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
any course's unit numbering**. It is a free-text field on bank items (not yet a
controlled vocabulary in `data/taxonomies.json` — that promotion is a later
step once the topic list stabilises). One `topicId` maps to exactly one shared
bank file pair (`<topicId>.json` for MCQ, `<topicId>-frq.json` for FRQ).

### Registry

| `topicId` | Bank files | Courses that draw from it | Notes |
|---|---|---|---|
| `kinematics-1d` | `kinematics-1d.json`, `kinematics-1d-frq.json` | `basis-physics-8` (live) · `ap-physics-1`, `ib-physics-sl`, `ib-physics-hl` (planned) | One-dimensional motion only: motion language, `x`/`v`/`a`–`t` graphs, constant-acceleration equations, 1-D free fall, vector components / SOHCAHTOA. **No** projectile motion, force-based reasoning, or calculus — those live in other topics. 250 MCQ + 50 FRQ converted from the Founder-approved BASIS Unit 2 test bank. |
| `forces-and-newtons-laws` | `forces-and-newtons-laws.json`, `forces-and-newtons-laws-frq.json` | `basis-physics-8` (live) · `ap-physics-1` (planned) | Gravity (`F_G = G m₁m₂/r²`), inertia and Newton's first law, force identification and free-body diagrams, equilibrium, Newton's second law, inclined planes (with/without friction), Newton's third law, Hooke's law. 1-D net-force reasoning and simple inclines; no 2-D vector force addition beyond incline components. 250 MCQ + 50 FRQ converted from `resources/physics8/rescue_sprint/unit_03_forces/test_bank/`. The 10 universal-gravitation numerical items are `calculatorFree: false` (a scientific calculator is permitted for that outcome per DEC-040). |

The existing AP Physics 1 Unit 2 banks (`ap1-u2-*.json`) predate this model and
are **not** migrated yet; they stay course-keyed until a later pass. New banks
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

**Not started:** independent physics review of the auto-assigned tags and
synthesised hints; promoting `topicId` to a controlled vocabulary; cross-tagging
to AP/IB; migrating the `ap1-u2-*` banks.
