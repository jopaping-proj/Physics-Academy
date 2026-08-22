# Physics Academy

Interactive AP Physics 1, AP Physics 2, and IB Diploma Physics SL/HL repository. See `docs/master-project-prompt.md`, `docs/rigor-standard-addendum.md`, and `docs/architecture-proposal.md` for the full design and rigor standards this repository is built against.

## Status

Phase 1 (architecture) complete: directory structure, dark-theme design system, reusable component CSS, JS module skeletons, and a working static build pipeline. One placeholder lesson (`content/ap-physics-1/unit-2-dynamics/newtons-second-law.json`) exists to validate the build — it is **not** finished Phase 2 content; see the `_comment` field in that file.

## Building

Requires Node 18+, no other dependencies.

```
npm run build
```

Reads every `content/**/*.json` lesson file, renders it through `build/templates/lesson.html`, and writes a fully self-contained static site to `dist/` (HTML plus copies of `css/`, `js/`, `assets/`, `data/`). `dist/` is gitignored — it's build output, not source.

```
npm run serve
```

Builds and serves `dist/` locally for preview (uses `npx serve`, requires network access the first time).

## Deploying

`dist/` is a complete static site — publish it via GitHub Pages (Actions workflow publishing `dist/` as the Pages artifact) or any static host. No backend, no database (see `docs/master-project-prompt.md` §25/§30).

## Content authoring

Lessons are authored as JSON, not hand-written HTML — see the schema comment at the top of `build/build.js`. Never hand-edit files under `dist/`; they're regenerated on every build.
