# Deploying the site to GitHub Pages — step by step

**Goal:** make `https://jopaping-proj.github.io/Physics-Academy/` serve the built
site (`physics-repository/dist/`) instead of a 404.

**Why it's currently broken:** GitHub Pages is set to *"Deploy from a branch"*, so
GitHub publishes the repository *root* — which has no `index.html`. The real site
is built by the `Deploy site to GitHub Pages` Action into `dist/` (which is
git-ignored, so it never appears on a branch). Pages has to be told to publish the
**Action's** output.

There are two ways. Try A first — it needs no clicking.

---

## Path A — let the workflow flip the switch (recommended)

The workflow now has `enablement: true` on its `configure-pages` step, which asks
GitHub to enable Pages **with "GitHub Actions" as the source** the next time it
runs. So you just need to run it:

1. Push any commit that touches `physics-repository/**` or `.github/workflows/pages.yml`
   (committing the current changes will do it), **or** trigger it by hand:
   - Open **`https://github.com/jopaping-proj/Physics-Academy/actions`**
   - In the left sidebar, click the workflow **"Deploy site to GitHub Pages"**
   - Click the **"Run workflow"** button (top-right of the run list) → leave branch
     `main` → **"Run workflow"**
2. Wait ~1–2 min for both jobs (`build`, then `deploy`) to go green.
3. Open the `deploy` job — its summary shows the live URL. Visit it.

If the `deploy` job succeeds, you're done — skip to **Verify** below.

If `configure-pages` still fails with a permissions error, do Path B.

---

## Path B — flip the switch by hand in Settings

The control is on the **Pages** settings page. The exact spot:

1. Go to **`https://github.com/jopaping-proj/Physics-Academy/settings/pages`**
   (or: repo home → **Settings** tab → in the left sidebar, under
   *"Code and automation"*, click **Pages**).
2. You'll see a section titled **"Build and deployment"**.
3. The **first row of that section is labelled "Source"**, with a **dropdown
   button** next to it. Right now that button says **"Deploy from a branch"**.
   - **Click the "Deploy from a branch" button.** A short menu drops down with two
     choices: *Deploy from a branch* and **GitHub Actions**.
   - Choose **"GitHub Actions"**.
4. The page reloads that section. It may now show a card offering starter
   workflows — **ignore it**, our workflow (`pages.yml`) already exists. There is
   nothing to Save; the choice takes effect immediately.
5. Now run the workflow (Actions tab → *Deploy site to GitHub Pages* → *Run
   workflow* → `main` → *Run workflow*), as in Path A step 1.

### Can't find the "Source" dropdown?

- **Make sure you're on the repo's Settings → Pages**, not your account settings.
  The URL should end in `/Physics-Academy/settings/pages`.
- The "Source" row is **above** the "Custom domain" box. If you only see "Custom
  domain", scroll up.
- If the whole Pages section is missing or greyed out, the repo may have been
  switched to **private**. Pages on a private repo needs a paid plan
  (Pro/Team). Make the repo public (**Settings → General → scroll to "Danger
  Zone" → "Change visibility"**) or upgrade, then retry.
- If there is genuinely **no dropdown** and it just says "Deploy from a branch"
  as plain text with branch pickers, your account/org may be on an older UI —
  use **Path A**, which doesn't need this screen at all.

---

## Custom domain (`physica.io`)

You already removed the `CNAME`, so Pages will serve from
`jopaping-proj.github.io/Physics-Academy/` and the build uses only relative paths,
so that works with no extra config.

If you *do* want `physica.io` later:
1. At your DNS host, point the domain at GitHub Pages —
   `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153` (and `AAAA` to `2606:50c0:8000::153` … `8003::153`), **or**
   a `CNAME` record for `www` → `jopaping-proj.github.io`.
2. Create `physics-repository/CNAME` containing just `physica.io` — the build
   already copies it into `dist/` (`build/build.js`), so every deploy keeps the
   domain.
3. In Settings → Pages → "Custom domain", enter `physica.io`, wait for the DNS
   check to pass, then tick **"Enforce HTTPS"**.

---

## Verify (all three page types)

Once the `deploy` job is green, open the live URL and check:

| Page | Path |
|---|---|
| Homepage (course/unit list) | `/` |
| Unit index (concept check → lessons → concept check) | `/ap-physics-1/unit-2-dynamics/unit-2-index.html` |
| A lesson deck | `/ap-physics-1/unit-2-dynamics/systems-and-center-of-mass.html` — slides advance, math renders, the Center-of-Mass Explorer canvas draws |
| Concept inventory | `/ap-physics-1/unit-2-dynamics/unit-2-concept-check.html` — submits, shows score only |

Then add the live URL to `README.md` and to the repo's **About** panel (the gear
icon on the repo home page → tick *"Use your GitHub Pages website"*).
