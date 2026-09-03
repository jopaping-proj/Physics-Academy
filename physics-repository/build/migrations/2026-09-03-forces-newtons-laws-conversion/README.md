# forces-and-newtons-laws bank conversion (2026-09-03)

Conversion of the Founder-approved BASIS Physics 8 Unit 3 test bank
(`resources/physics8/rescue_sprint/unit_03_forces/test_bank/`, 250 MCQ + 50 FRQ)
into the native topic-keyed banks `data/question-bank/forces-and-newtons-laws.json`
+ `forces-and-newtons-laws-frq.json`.

Adapted from the `2026-09-03-kinematics-1d-conversion/` scripts. See
`docs/question-bank-topics.md`.

## Run

```
node build/migrations/2026-09-03-forces-newtons-laws-conversion/1-parse.mjs
node build/migrations/2026-09-03-forces-newtons-laws-conversion/2-enrich.mjs
```

## Differences from the kinematics-1d pipeline

- **Parser** now also handles combined rationale bullets, e.g.
  `- A, C, D: each reflects a power-of-ten error …` — expanded to per-letter
  entries. (Backport to the kinematics parser if it is ever re-run.)
- **`needsCalc()`** additionally flags scientific-notation arithmetic
  (`\times 10^` appearing 2+ times) and any working that quotes
  `6.67 \times 10^{-11}` — the universal-gravitation items need a calculator
  and are held out of the no-calculator BASIS unit test.
- Cluster → `skill` / `representation` / `hint` maps rewritten for the eight
  forces clusters; `topicId: "forces-and-newtons-laws"`; figure paths point at
  `assets/diagrams/basis-physics-8/unit-3/forces-bank/`; `unit` field set to
  "Unit 3: Forces and Newton's Laws".
- The 8 source SVGs (`u3_fbd_*`, `u3_incline_*`, `u3_spring_*`) were transferred
  + restyled (palette/font normalisation) into the forces-bank asset dir.
