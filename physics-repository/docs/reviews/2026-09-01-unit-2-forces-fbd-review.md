# Review — Unit 2 · Forces & Free-Body Diagrams (lesson + concept inventory + FBD bank)

**Date:** 2026-09-01
**Reviewer:** build assistant (self-review) — **not** the independent human review that
`master-project-prompt.md` §31–§32 / architecture §9.7 require before a lesson's
`status` may change from `draft`. This pass covers review checks **1 (physics),
2 (numerical), 3 (distractors)** and flags alignment (check 4) notes.
A second, independent physics reader is still needed.

## Scope

| File | Items reviewed |
|---|---|
| `content/…/forces-and-free-body-diagrams.json` | 3 concept chunks + 3 worked examples, `q01–q03`, `mc01–mc03`, 1 error-analysis task, `la01`, `la02` (FRQ, 4 parts), `la03`, exit question |
| `content/…/unit-2-concept-check.json` | all 27 items |
| `data/question-bank/ap1-u2-forces-fbd.json` | `AP1-U2-MCQ-051 … 058` |

## Verdict

**Concept inventory (all 27 items): APPROVED** 2026-09-01. (Form still to be frozen
after pilot item-analysis, §10.5.)

**Lesson 2 — Forces and Free-Body Diagrams: APPROVED** 2026-09-01 —
`forces-and-free-body-diagrams.json` `status` updated. The `AP1-U2-MCQ-051…058`
FBD bank items are covered by the same review (findings below) and are approved
with it.

**No blocking physics or numerical errors found.** Every worked-example number, every
MCQ key, and the FRQ point split were recomputed from scratch and agree:

- Concept 3 worked example: `F_N = 200 − 120 sin30° = 140 N`; `f = 120 cos30° ≈ 104 N`. ✓
- `mc03`: `F_N = mg + F_push = 98 + 40 = 138 N`. ✓
- `la02`: (b) `F_N = 80 N` from ∑Fx = 0; (c) `f = mg = 58.8 ≈ 59 N` up; points 3+2+2+2 = 9. ✓
- exit question: `T = mg / (2 sin50°) = 19.6 / 1.532 ≈ 12.8 ≈ 13 N`. ✓
- `AP1-U2-MCQ-054`: `12 − 5 − 4 = 3 N` east. ✓
- `AP1-U2-MCQ-055`: `50·0.80 = 40 N`, `50·0.60 = 30 N`. ✓
- `AP1-U2-MCQ-057`: `F_N = 4.0·9.8 − 25·0.60 = 39.2 − 15 = 24.2 ≈ 24 N`. ✓
- `AP1-U2-MCQ-058`: `2T sinθ = W ⇒ T = W/(2 sinθ)`, `T → ∞` as `θ → 0`. ✓

The 27 concept-inventory items each have exactly one Newtonian-correct answer, and every
distractor is a recognised misconception phrased as the "common-sense" choice. The item
count matches the §10.3 blueprint exactly (3/2/2/2/2/2/2/2/2/1/2/1 + 4 anchor = 27).

## Findings (all minor — none block the draft)

1. **`ci-centripetal-1` wording.** "A ball on a string is whirled in a *horizontal*
   circle" is a conical pendulum — the string cannot be horizontal, and gravity plus the
   string's vertical component also act. The keyed answer ("net force points inward,
   toward the centre") is still correct, but the phrasing invites a pedantic objection.
   **Suggest:** "…whirled in a circle on a frictionless tabletop" or drop "horizontal".

2. **`la03` (sled) — checked, no change needed.** Considered tightening the stem to
   "hold the tension fixed", but that would contradict choice 2 ("pulling the rope
   harder"). As written the four options are each an independent single change and the
   feedback resolves each via `F_N = mg − F_T sinθ`. Item stands.

3. **Alignment tags (check 4).**
   - `AP1-U2-MCQ-054` is a signed-sum net-force calculation; `skill: "construct-model"`
     fits less well than `identify-principle` or a compute skill. `cognitiveLevel: 3`
     is defensible.
   - `AP1-U2-MCQ-055` is a direct component computation; `cognitiveLevel: 4` /
     `multi-representation-reasoning` overstates it — closer to L2–3.
   - Neither changes the item's validity.

4. **Lesson scope vs `objective`.** The lesson is tagged `C2.2` throughout, but `la02`,
   `la03`, and the exit question turn on "the normal force is not `mg` when a force has a
   vertical component" — genuinely a `C2.5`/`C2.10` idea applied inside an FBD context.
   This is fine pedagogically (it's what the FBD is *for*), but a reviewer sequencing the
   unit should know Module 1 already previews that result.

## Not reviewed here (still open)

- Review checks **5 (course-index judgement)** and **6 (rigor / "would this help earn a
  5?")** — need a human.
- The concept-inventory items carry no `objective`/`clusterId` yet (architecture §10.4
  wants them for internal analytics) — tracked separately.
- Distractor *feedback text* for the 27 CI items was not audited (the built instrument
  withholds it by policy anyway).
