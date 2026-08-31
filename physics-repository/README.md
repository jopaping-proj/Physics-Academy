# Physics Academy

Interactive AP Physics 1, AP Physics 2, and IB Diploma Physics SL/HL repository. See `docs/master-project-prompt.md`, `docs/rigor-standard-addendum.md`, and `docs/architecture-proposal.md` for the full design and rigor standards this repository is built against.

## Status

Phase 1 (architecture) and Phase 2 (prototype lesson) complete. The reference implementation is `content/ap-physics-1/unit-2-dynamics/newtons-second-law.json`, delivered as a **slide deck** — one card at a time, learner-paced Back/Next with a progress bar and a "Read as one page" toggle (`js/lesson-slides.js`; see `docs/master-project-prompt.md` §4). It has: sidebar section nav with per-section completion ticks, a comprehension gate ("Require answers", default on — Next stays disabled on a check card until the student engages with it), hook, objectives, three concept chunks split across cards (idea / representation / worked example / check), inline free-body-diagram figures (box + dot conventions, authored as SVG under `assets/diagrams/` and inlined at build time), subgoal-phased worked examples revealed one part at a time with a self-explanation prompt, KaTeX, formative quizzes with collapsible hint/solution disclosure, a live Formula Explorer (mass + net-force sliders → an F-vs-m graph whose slope is the acceleration, all hand-drawn on Canvas — no charting library), a Canvas "Cart on a Track" simulation with a prediction gate, static-vs-kinetic friction, and its own F-vs-m slope graph, misconceptions, error analysis, and a final lesson assessment — verified rendering and interactive in a real browser (headless Chromium). The Unit 2 (Dynamics) question bank backing it lives in `data/question-bank/ap1-u2-dynamics.json` (50 MCQs) and `ap1-u2-dynamics-frq.json` (15 FRQs). The Unit 2 curriculum architecture, unit test-bank plan, and concept-inventory diagnostic spec are in `docs/ap-physics-1-unit-2-architecture.md`. Phase 3 (extracting this lesson's one-off pieces into the general component library) has not started.

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
