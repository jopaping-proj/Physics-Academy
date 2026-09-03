# BASIS Physics 8

**Course ID:** `basis-physics-8`  
**Integration status:** Draft architecture with a developed Unit 1, source-backed unit maps, and test-bank manifests

This course mirrors the AP Physics 1 repository's course/unit-index architecture without copying AP-specific standards or claims. Unit maps are generated from the authoritative files under `resources/physics8`. A null lesson slug means the page is a planned placeholder, not a built lesson.

## Course map

- Unit 1: Graphing and Dimensional Analysis — `unit-1-graphing-dimensional-analysis/unit-1-index.json`
- Unit 2: Kinematics — `unit-2-kinematics/unit-2-index.json`
- Unit 3: Forces and Newton's Laws — `unit-3-forces-newtons-laws/unit-3-index.json`
- Unit 4: Energy — `unit-4-energy/unit-4-index.json`
- Unit 5: Thermal Physics — `unit-5-thermal-physics/unit-5-index.json`
- Unit 6: Momentum and Collisions — `unit-6-momentum-collisions/unit-6-index.json`
- Unit 7: Waves and Light — `unit-7-waves-light/unit-7-index.json`
- Unit 8: Electric Current and Circuits — `unit-8-electric-current-circuits/unit-8-index.json`

## Source coverage

- Units 1–8 include source-backed outcome clusters from dedicated Markdown files; the Unit 1 source is titled **Unit 1** and supplies all 18 outcomes used by the five-lesson sequence.
- Unit 1 includes an AP-style score-only concept inventory, five native lessons, a 50-MCQ bank, a 15-FRQ bank, and a generated 45-minute unit test. These materials are draft pending instructional review.
- Unit 2 includes its approved production diagnostic and a native interactive Lesson 1.
- Units 2–3 include developed lesson-source Markdown and 300 indexed assessment items each.
- Unit 4 includes 300 active indexed assessment items plus 29 retired records.
- Units 5–8 currently have outcomes only; their lessons and assessments remain planned.

## Test-bank boundary

The files `data/question-bank/basis-p8-*-index.json` are provenance manifests. They recalibrate the source IDs from `U#-*` to the course-scoped `BP8-U#-*` namespace while retaining `sourceId`. They do not claim that the Markdown questions have been converted to the site's native interactive question schema.
