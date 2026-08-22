# Architecture Proposal v1 — Physics Academy Repository

Response to `master-project-prompt.md` §36 (First Task). Covers all ten requested items plus the one decision that needs sign-off before Phase 2 (Prototype Lesson) starts.

---

## The decision that actually matters here

Before the ten items: §25 explicitly rules out hand-coding hundreds of independent HTML files, and separately rules out React/Vue/Next.js until they solve a genuine problem. Those two constraints together force a specific choice most teams skip past — something has to turn structured lesson data into the sidebar/hook/chunk/quiz page every lesson needs, and it can't be a framework and can't be manual authoring.

**[Likely]** The right middle path is a small Node build script — no framework, just a script — that reads one JSON file per lesson plus a shared HTML template, and writes a static HTML page per lesson. Interactive pieces (quizzes, graphs, simulations) hydrate client-side from the same JSON, embedded in the page or fetched alongside it. This is boring on purpose: it's the least amount of tooling that avoids both banned approaches. The alternative — a fully client-side single-page app that fetches JSON and renders lessons in the browser with no build step — is simpler to start but means every lesson page is blank until JavaScript runs, which is bad for a school-Wi-Fi/student-device performance target (§29) and bad for anyone linking directly to a lesson. I'm recommending the build-script approach; flag now if you'd rather start pure client-side and add the build step later, because retrofitting it after fifty lessons exist is real rework (see item 9).

---

## 1. Final project directory structure

```
physics-repository/
│
├── index.html                     # homepage shell (built)
├── README.md
├── package.json                   # build script + dev server deps only
│
├── build/                         # the build script itself
│   ├── build.js                   # reads content/, writes dist/
│   └── templates/
│       ├── lesson.html            # shared lesson page template
│       ├── homepage.html
│       └── unit-index.html
│
├── content/                       # ← authored source of truth, not served directly
│   ├── ap-physics-1/
│   │   └── unit-2-dynamics/
│   │       └── newtons-second-law.json
│   ├── ap-physics-2/
│   ├── ib-physics/
│   │   ├── sl/
│   │   └── hl/
│   └── shared-concepts/           # cross-course concept content (momentum, fields, etc.)
│
├── data/
│   ├── question-bank/             # one JSON file per unit, schema per §27
│   ├── taxonomies.json            # controlled vocab: skills, representations, difficulty labels
│   └── curriculum-map.json        # AP framework / IB syllabus cross-references
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── diagrams/
│
├── css/
│   ├── variables.css              # design tokens, see item 3
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── lessons.css
│
├── js/
│   ├── navigation.js
│   ├── assessment.js
│   ├── simulations.js
│   ├── graphs.js
│   ├── formula-explorer.js
│   ├── content-loader.js
│   └── difficulty.js              # canonical taxonomy constants + badge rendering
│
├── components/                    # template partials, see item 4
│
├── simulations/                   # one folder per simulation, self-contained JS+assets
│
├── dist/                          # build OUTPUT — gitignored, deployed to GitHub Pages
│
└── docs/
    ├── master-project-prompt.md
    ├── rigor-standard-addendum.md
    └── architecture-proposal.md   # this file
```

Reasoning: `content/` is new relative to §25's sketch — it's the authored JSON that a teacher edits directly in VS Code, separate from `dist/` (generated, gitignored, what actually deploys). This is the concrete form of the content/presentation separation §26 already asks for; without a dedicated `content/` tree, "separate content from presentation" has no home to live in. `data/taxonomies.json` exists specifically to stop the difficulty-label drift we just found — skills and representation tags need the same discipline or they'll fragment the same way.

## 2. Lesson-page information architecture

Three horizontal zones on desktop, collapsing to one column + drawer on mobile (§24):

**Sidebar (left, sticky, collapsible below ~900px).** Course → Unit → Topic → Subtopic → Lesson breadcrumb; in-page anchor list generated from the lesson's chunk titles; learning-objectives list (linking to §6 sub-objectives); current-position indicator (scrollspy-driven active-anchor highlight).

**Main content (center).** Follows the §4 flow (hook → objectives → prior knowledge → chunks → worked examples → simulation → misconceptions → representation connections → lesson assessment → AP/IB connection → summary → exit question → further practice), with each concept chunk internally following §7's physical-intuition → qualitative → representation → model → worked-example → independent-reasoning → transfer progression. "Further Practice" at the end renders three sub-sections using the §3 grouping (Foundation / Examination Readiness / Mastery-Distinction), each populated by pulling questions from the question bank filtered by the canonical difficulty tags that map into that group.

**No persistent right rail.** Considered one for a running formula/reference sheet, but decided against it for v1 — it eats horizontal space the multi-representation graphs and simulations need (§11–§13), and duplicates content already reachable via Formula Relationship Explorer (top-level nav). Worth revisiting only if user testing shows students wanting a formula sheet visible while working a problem.

Each chunk, hook, and formative check is a distinct DOM section with a stable `id` so the sidebar anchors and any future deep-linking/search-result-linking can target it directly.

## 3. Dark-theme design system

CSS custom properties in `css/variables.css`, matching §22's palette:

```css
:root {
  --bg-canvas: #0d1117;
  --bg-panel: #161b22;
  --bg-panel-raised: #1c2330;
  --text-primary: #e6edf3;
  --text-secondary: #8b96a5;
  --accent: #58a6ff;
  --accent-muted: #1f6feb;
  --warning: #d29922;
  --success: #3fb950;
  --error: #f85149;          /* also used for misconception/error-analysis cards */

  --font-body: -apple-system, "Segoe UI", Inter, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 1rem;
  --space-4: 1.5rem;  --space-5: 2.5rem;

  --radius-sm: 4px; --radius-md: 8px;
  --line-length-max: 68ch;      /* readability cap for prose columns, §22 */

  --focus-ring: 0 0 0 3px rgba(88, 166, 255, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

Difficulty badges get their own token set mapped from `difficulty.js`'s canonical enum (foundation → muted gray, developing → cyan, ap-ib-standard → accent blue, ap5-ib7-target → amber, distinction-stretch → a restrained purple/magenta not otherwise used elsewhere, so distinction-tier content is visually distinct without competing with warning/error colors).

## 4. Reusable UI components

| Component | Purpose |
|---|---|
| `HookCard` | Predict-and-commit opening question (§5) |
| `ObjectiveList` | Major + sub-objectives, checkable as read (§6) |
| `ConceptChunk` | Wraps one chunk's explanation/representation/example/check (§7) |
| `WorkedExample` | 13-step structure from §10, with progressive scaffold-fade styling (addendum §16) |
| `FormativeCheck` | Question(s) + immediate distractor-specific feedback (§8) |
| `HintSolutionDisclosure` | Progressive reveal: hint → hint → solution → explanation (§9) |
| `MisconceptionCard` | Diagnostic question + explicit reasoning correction (§17, addendum §12) |
| `ErrorAnalysisCard` | Presents a flawed student solution + 4-step critique prompt (addendum §13) — new, not in original component list, needed because §13 is a distinct interaction pattern from a misconception card |
| `RepresentationSwitcher` | Tabs/toggle among verbal/graph/diagram/equation views of the same idea (§11) |
| `FormulaExplorer` | Slider-driven manipulative (§12) |
| `GraphExplorer` | Plotly-backed parameterized graph (§13) |
| `SimulationContainer` | Standard chrome around any simulation: controls, reset, pause/play, prediction prompt slot (§14) |
| `APIBExamCard` | Labeled AP-style or IB-style question block (§18–§19) |
| `DifficultyBadge` | Renders one of the five canonical tags (addendum §21) |
| `RetrievalPrompt` | Recent/spaced/interleaved/generative retrieval question (addendum §17) |
| `Sidebar` | Sticky TOC + objectives + breadcrumb (item 2) |
| `SearchBar` | Global search input, wired up in Phase 5 |

## 5. JavaScript modules needed

- `navigation.js` — sidebar scrollspy, mobile drawer, breadcrumb rendering.
- `content-loader.js` — fetches/parses a lesson's JSON at runtime (or reads the embedded JSON blob the build step inlines), exposes it to other modules.
- `assessment.js` — quiz rendering, answer checking, distractor-specific feedback lookup, progressive hint/solution disclosure.
- `difficulty.js` — canonical difficulty/cognitive-level constants, badge color mapping, filtering helpers (used by Further Practice grouping and future unit-review filtering).
- `graphs.js` — thin wrapper around Plotly.js: parameterized-graph helper functions shared by Graph Explorer and Formula Explorer.
- `formula-explorer.js` — slider state management, live equation/graph/value updates.
- `simulations.js` — shared simulation chrome (pause/play/reset/prediction-prompt), imported by individual simulation modules in `simulations/`.
- `search.js` — Phase 5, not built yet; stub only.

Only `navigation.js`, `content-loader.js`, and `difficulty.js` load on every page. `graphs.js`, `formula-explorer.js`, and individual simulation modules lazy-load only on lessons that use them, per §29.

## 6. Content storage recommendations

- **JSON** for lesson content: one file per lesson under `content/`, containing objectives, chunk structure, and references to question-bank IDs. Long-form explanation text is stored as Markdown *strings* inside the JSON values (not separate .md files) so a lesson stays a single file a teacher can open and edit start-to-finish, rather than juggling a JSON manifest plus half a dozen matching Markdown fragments.
- **JSON** for the question bank (§27 schema), one file per unit, referenced by ID from lesson files — this is what makes retrieval practice, mixed review, and mastery tracking possible later without duplicating question text across lessons.
- **HTML** only for the build templates (`build/templates/`) — never for lesson content directly. This is the mechanism that satisfies §25's "not hundreds of independently coded HTML files" instruction.
- **JavaScript** only for behavior (simulations, interactive state), never for storing lesson content. If content logic starts leaking into a `.js` file, that's a signal the JSON schema is missing a field, not a reason to add a JS-authored exception.
- **Markdown** files at the repo root (`docs/`) for the governing documents themselves — already the pattern in use.

## 7. Question-bank data structure

Already resolved above — see the extended schema now living in `master-project-prompt.md` §27, with `difficulty` locked to the addendum §21 canonical scale and `cognitiveLevel`, `skill`, `representation`, `misconceptionTested`, and `apIbConnection` added per addendum §18.

## 8. Simplest technology stack that scales to hundreds of lessons

- **Rendering:** vanilla JS + the small Node build script described above. No framework.
- **Math typesetting:** **KaTeX over MathJax** — this is a deviation from §16's either/or and worth flagging explicitly. KaTeX renders synchronously and is substantially lighter, which matters directly for §29's school-Wi-Fi/low-end-device target once a page has dozens of equations; MathJax's async layout pass is more flexible but slower at this scale. Recommend KaTeX unless a specific notation need forces MathJax's larger feature set.
- **Graphing:** Plotly.js, lazy-loaded only on pages with a Graph Explorer or data-analysis task.
- **Simulations:** p5.js or raw Canvas/SVG per §14, lazy-loaded per simulation.
- **Build/deploy:** a single `npm run build` script (no bundler needed yet — ES modules loaded natively are fine at this scale) producing `dist/`, deployed via a GitHub Actions workflow to GitHub Pages on push to main.
- **No database, no backend** — matches §25 and §30 directly; static JSON + static hosting covers everything through at least Phase 5.

## 9. Architectural choices that could become difficult to change later

- **The lesson JSON schema's shape.** Once fifty-plus lesson files exist against a schema, changing a field name or nesting structure means a scripted migration across every file, not a quick edit. Worth spending real time getting this right during the Phase 2 prototype rather than after Phase 4 course expansion.
- **Static-build vs. pure-client-side rendering** (the decision flagged at the top). Switching from one to the other after lessons exist means rewriting how every page is produced and re-testing all of them.
- **The canonical difficulty scale** — just resolved this session. Locked in now; a second change later means re-tagging every question again.
- **URL/slug structure** (e.g. `/ap-physics-1/unit-2/newtons-second-law/`). This determines GitHub Pages folder layout, any future search indexing, and every external bookmark/link a student or colleague makes. Decide the pattern before Phase 4, not during it.
- **The quiz component's expected JSON contract** (`assessment.js` + the question-bank schema). Once dozens of lessons' formative checks depend on a specific shape, changing it requires touching every consuming lesson file, not just the component.
- **The `skill`/`representation` controlled vocabulary in `data/taxonomies.json`.** Same drift risk as the difficulty scale, just less painful to fix each time — still worth stabilizing early rather than letting every lesson author invent its own labels.

## 10. Best AP Physics 1 lesson for the system prototype

**Recommendation: AP Physics 1, Unit 2 (Dynamics) — "Newton's Second Law: Force, Mass, and Acceleration."**

This isn't an arbitrary pick — both governing documents already scaffold examples around exactly this lesson (§12's Formula Explorer walkthrough and addendum §9's four-level formula-mastery example are both F = ma). Building the prototype around content you've already half-specified means the prototype exercises real content decisions instead of placeholder text.

It also happens to be the strongest test of the whole system in one lesson: a natural Formula Explorer (mass/acceleration sliders → force, exactly as specified); a natural Graph Explorer (F vs a, F vs m, both proportionality shapes to predict-then-verify per addendum §10); a natural simulation (adjustable force and mass on a cart, real-time FBD and vectors); rich, well-documented misconceptions (heavier objects "need more force to move" conflated with F = ma, constant velocity mistaken for zero net force, confusing net force with a single applied force); and a clean near/far-transfer path for the lesson-exit assessment (addendum §19's own worked example — ramp → pulled-up-ramp → banked road — is a Newton's-second-law problem at its core, so it can be reused directly as the far-transfer question rather than invented from scratch).

The one gap: addendum §14 (interleaving) genuinely can't be tested by a first lesson with nothing preceding it to interleave with — noted earlier, not a flaw in this choice, just a limit of any first lesson.

---

## What I'd do next, if you agree with the above

Phase 1 per §34 is directory scaffolding + design system + navigation shell + the build script — none of it lesson content yet. I'd build that skeleton next, then the Newton's Second Law lesson as the Phase 2 prototype. Say the word and I'll start scaffolding the actual files in the repository rather than proposing them.
