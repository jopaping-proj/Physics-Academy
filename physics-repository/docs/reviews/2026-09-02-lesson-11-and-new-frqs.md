# Physics self-audit — Lesson 11 derivation + FRQ-016…025

**Date:** 2026-09-02 · **Reviewer:** author self-check (not an independent human read — that is still required before `status: approved` on Lesson 11 or before these FRQs go into a graded exam).

## Lesson 11, Concept 1 — the $a_c = v^2/r$ derivation

Checked against *Cutnell & Johnson, Physics* 9e §5.2 (the source cited in the card).

| Claim | Status |
|---|---|
| The two velocity vectors have equal magnitude $v$ and the angle between them equals the angle $\theta$ the radius sweeps (because radius ⊥ velocity at every point). | ✅ matches C&J |
| Velocity triangle ($v$, $v$, base $\Delta v$, apex $\theta$) is isosceles. | ✅ |
| Position triangle O–C–P ($r$, $r$, chord $\approx$ arc $= v\,\Delta t$ for small $\Delta t$, apex $\theta$) is isosceles. | ✅ |
| Same apex angle + both isosceles ⇒ similar ⇒ $\Delta v / v = v\,\Delta t / r$. | ✅ |
| $\Delta v/\Delta t = v^2/r$, and $\Delta \vec v \to$ toward the centre as $\theta \to 0$. | ✅ |

No physics errors found. The diagram `circular/centripetal-derivation.svg` reproduces C&J Figures 5.2–5.3.

## FRQ-016 … FRQ-025 (`data/question-bank/ap1-u2-frq-extra.json`)

Every numerical part re-worked independently:

| FRQ | Topic | Numbers checked | Notes |
|---|---|---|---|
| 016 | incline + kinetic friction | $F_N = 26\text{ N}$, $a = 3.3\text{ m/s}^2$ | ✅ |
| 017 | experimental design, $\mu_s = \tan\theta_c$ | derivation, mass-independence | ✅ |
| 018 | flat curve | $f_s = 4500\text{ N}$, $v_{\max} \approx 17\text{ m/s}$ | ✅ |
| 019 | vertical circle | $F_T = 3.0\text{ N}$ (top), $v_{\min} = \sqrt{gr} \approx 2.8\text{ m/s}$ | ✅ |
| 020 | force–extension graph | $k = 50\text{ N/m}$; $x(2.5\text{ N}) = 0.050\text{ m}$ | **fixed** — the original stretch column ($0.058$, $0.082$) did not cleanly show linear-then-elastic-limit; changed to $0.060$, $0.090$ (the $4\text{ N}$ point now clearly over-stretches) and rewrote the model responses. |
| 021 | apparent weight in a lift | $500 / 600 / 0\text{ N}$ | ✅ |
| 022 | table block + hanging mass | $a = 3.3\text{ m/s}^2$, $F_T \approx 13\text{ N}$ (cross-checks) | ✅ |
| 023 | error analysis, two blocks in contact | $a = 3.0\text{ m/s}^2$, $F_{contact} = 6.0\text{ N}$ (cross-checks) | ✅ |
| 024 | truck/car, third law paragraph | $a$ ratio $\approx 6.7$ | ✅ |
| 025 | crate, angled rope | $F_N = 40\text{ N}$, $a \approx 4.1\text{ m/s}^2$; horizontal-rope comparison $\approx 4.2\text{ m/s}^2$ | ✅ |

Point totals all equal the sum of parts (`build/validate.js` also enforces this). One item (020) corrected; the rest passed.

## Still outstanding

- Independent human physics reader for Lesson 11 (whole lesson) and Lesson 11 `la02` before `status: approved`.
- Rubric wording review for the paragraph-argument (024) and experimental-design (017) items by someone familiar with AP Physics 1 Section II scoring.
