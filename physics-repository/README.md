# Physics Academy

Interactive AP Physics 1, AP Physics 2, and IB Diploma Physics SL/HL repository. See `docs/master-project-prompt.md`, `docs/rigor-standard-addendum.md`, and `docs/architecture-proposal.md` for the full design and rigor standards this repository is built against.

## Status

Phase 1 (architecture) and Phase 2 (prototype lesson) complete; Phase 4 is underway. Unit 2 has **Lesson 1 — Systems and Center of Mass** (Canvas Center-of-Mass Explorer), **Lesson 2 — Forces and Free-Body Diagrams** (Canvas FBD-builder, **approved**), **Lesson 3 — Newton's First Law: Inertia and Equilibrium**, and **Lesson 4 — Newton's Second Law** (the reference implementation), plus the **approved** Unit 2 concept inventory. Lessons 1 and 3 are draft (physics unreviewed). Every lesson carries a `lessonNumber` shown as "Lesson N"; the unit index page orders concept-check → lessons → concept-check. Every free-body diagram follows the permanent drawing rules in `docs/master-project-prompt.md` §11: contact forces start at the surface of contact, gravity from the centre, dot-diagram forces from the edge, relative arrow lengths carry meaning, and no label ever overlaps the object, an arrow, an axis, or another label. The FBD SVGs are generated from specs by `build/gen-diagrams.js` (`build/render/fbd-svg.js`), which auto-places labels clear of everything and fits the viewBox; run it after editing a spec. The build runs `build/validate.js` first and **aborts** on controlled-vocabulary drift, a missing `courses`, a malformed `objective`/`cedTopic`, an unfeedbacked distractor, or a numeric concept-inventory option; every item now carries `objective` as a `C2.x` cluster id plus a `cedTopic` CED number (migrated by `build/migrations/2026-09-01-objective-cedtopic.js`). Each unit has a **unit index page** (`format: "unit-index"`) ordering the concept check (pre) → modules → concept check (post), and a **concept-inventory** page (`unit-2-concept-check.json`, `format: "concept-inventory"` → `js/concept-inventory.js`): a shuffled, calculator-free force-and-motion check taken before and after the unit, showing the student **only their score**. The reference implementation is `content/ap-physics-1/unit-2-dynamics/newtons-second-law.json`, delivered as a **slide deck** — one card at a time, learner-paced Back/Next with a progress bar and a "Read as one page" toggle (`js/lesson-slides.js`; see `docs/master-project-prompt.md` §4). It has: sidebar section nav with per-section completion ticks, a comprehension gate ("Require answers", default on — Next stays disabled on a check card until the student engages with it), hook, objectives, three concept chunks split across cards (idea / representation / worked example / check), inline free-body-diagram figures (box + dot conventions, authored as SVG under `assets/diagrams/` and inlined at build time), subgoal-phased worked examples revealed one part at a time with a self-explanation prompt, KaTeX, formative quizzes with collapsible hint/solution disclosure, a live Formula Explorer (mass + net-force sliders → an F-vs-m graph whose slope is the acceleration, all hand-drawn on Canvas — no charting library), a Canvas "Cart on a Track" simulation with a prediction gate, static-vs-kinetic friction, and its own F-vs-m slope graph, misconceptions, error analysis, and a final lesson assessment — verified rendering and interactive in a real browser (headless Chromium). The Unit 2 (Dynamics) question bank backing it lives in `data/question-bank/ap1-u2-dynamics.json` (50 MCQs) and `ap1-u2-dynamics-frq.json` (15 FRQs). The Unit 2 curriculum architecture, unit test-bank plan, and concept-inventory diagnostic spec are in `docs/ap-physics-1-unit-2-architecture.md` (v0.3.0 — CED-verified). Phase 3 is underway: the build-time render components are split into `build/render/` (`primitives.js`, `worked-example.js`, `sections.js`), and the runtime components live in `js/` (`assessment.js`, `lesson-slides.js`, `simulations.js`) — inventory in `docs/architecture-proposal.md` §4. Still one-off: the Formula Explorer interactive (generalize after a second such lesson).

## Building

Requires Node 18+, no other dependencies.

```
npm run build
```

Reads every `content/**/*.json` lesson file, renders it through `build/templates/lesson.html`, and writes a fully self-contained static site to `dist/` (HTML plus copies of `css/`, `js/`, `assets/`, `data/`). `dist/` is gitignored — it's build output, not source.

```
npm run serve
```

Builds, then serves `dist/` at `http://localhost:4173` with `build/serve.js` — a tiny zero-dependency static server (needed because lesson pages load JS that browsers won't fetch over `file://`).

## Deploying

`dist/` is a complete static site — no backend, no database (`docs/master-project-prompt.md` §25/§30).

`.github/workflows/pages.yml` builds `physics-repository/` and publishes `dist/` to **GitHub Pages** on every push to `main` that touches `physics-repository/**` (or on manual dispatch). One-time setup: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**. The build uses only relative paths, so it works at a project-Pages base path (`<user>.github.io/<repo>/`) with no configuration.

## Content authoring

Lessons are authored as JSON, not hand-written HTML — see the schema comment at the top of `build/build.js`. Never hand-edit files under `dist/`; they're regenerated on every build.
