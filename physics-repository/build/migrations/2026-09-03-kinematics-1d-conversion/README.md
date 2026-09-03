# kinematics-1d bank conversion (2026-09-03)

One-shot conversion of the Founder-approved BASIS Physics 8 Unit 2 test bank
(`resources/physics8/rescue_sprint/unit_02_kinematics/test_bank/`, Markdown,
250 MCQ + 50 FRQ) into the native topic-keyed banks
`data/question-bank/kinematics-1d.json` + `kinematics-1d-frq.json`.

See `docs/question-bank-topics.md` for the model and the field mapping.

## Run

```
node build/migrations/2026-09-03-kinematics-1d-conversion/1-parse.mjs   # -> scratch u2-parsed.json (paths are absolute; edit SRC/OUT if the tree moved)
node build/migrations/2026-09-03-kinematics-1d-conversion/2-enrich.mjs   # -> data/question-bank/kinematics-1d{,-frq}.json
```

`1-parse.mjs` writes its intermediate JSON next to itself via a `new URL`
relative path in the original run; both scripts hard-code absolute paths from
that session. Retarget `SRC` (parse) and `OUT_DIR` (enrich) before reuse.

## What it does

- **parse**: splits on `### <ID>`, reads `**Field:**` lines, `A.`–`D.` options,
  and the `**Rationale**` / `**Scoring rubric**` blocks. Converts `\( \)` → `$ $`
  and `\degree` → `^\circ`.
- **enrich**: 3-band → 5-band difficulty remap; `skill` / `representation` /
  `cognitiveLevel` by cluster + argument-framing detection; `feedback` from the
  rationale bullets; `hint` per cluster; `solution` from the "Correct (X)"
  bullet; `calculatorFree` via `needsCalc()` (inverse trig of non-standard
  angles, `\sqrt` of non-perfect-squares); 37°/53° convention prepended to
  vector-component stems.

Emits the **full bank** — 250 MCQ + 50 FRQ. Items that reference a graph/vector
SVG point at `basis-physics-8/unit-2/kinematics-bank/<name>.svg`; those 24 SVGs
were transferred + restyled from the source `test_bank/assets/` in the same pass
(gridline/text colours → house palette, fonts unified; the source's
Playwright-verified layouts kept).

`needsCalc()` marks `calculatorFree: false` for the ~16 MCQ that need a real
calculator (inverse trig of a non-standard angle, `\sqrt` of a non-perfect
square, forward trig of a non-convention angle); they stay in the bank but are
filtered out of the no-calculator BASIS unit test.
