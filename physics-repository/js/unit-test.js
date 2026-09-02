/**
 * Unit-test delivery (docs/test-generation.md).
 *
 * A timed practice test, RE-GENERATED ON EVERY LOAD from the unit's
 * question-bank pool:
 *   - a fresh seed each visit, so the item set, the question order and
 *     the option order are all different every attempt;
 *   - the item set is drawn to the difficulty distribution in
 *     data/test-blueprint.json (largest-remainder stratified sampling);
 *   - MCQ / FRQ counts come from config: a time budget (minutes) or an
 *     explicit count;
 *   - a countdown timer that auto-submits at 0:00;
 *   - MCQ auto-scored; FRQ self-scored against the model response and
 *     rubric; a composite % shown against the pass and target marks;
 *   - each attempt {pct, mcqPct, frqPct, durationSec, at} kept in
 *     localStorage (pa:ut:<key>).
 *
 * Plain <script> (see js/content-loader.js). Canvas-free.
 */
(function () {
  // ---- seeded RNG (mulberry32) + helpers ----
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function sample(pool, n, rng) {
    return shuffle(pool, rng).slice(0, Math.max(0, Math.min(n, pool.length)));
  }
  // largest-remainder stratified sample by item.difficulty against a {level: share} map
  function stratified(pool, n, dist, rng) {
    if (n >= pool.length) return shuffle(pool, rng);
    const groups = {};
    for (const it of pool) (groups[it.difficulty] = groups[it.difficulty] || []).push(it);
    const labels = Object.keys(dist).filter((k) => k[0] !== "_");
    const raw = labels.map((l) => n * dist[l]);
    const base = raw.map(Math.floor);
    let left = n - base.reduce((x, y) => x + y, 0);
    raw.map((v, i) => ({ i, f: v - base[i] })).sort((x, y) => y.f - x.f).forEach((r) => { if (left-- > 0) base[r.i]++; });
    let picked = [];
    labels.forEach((l, i) => { picked = picked.concat(sample(groups[l] || [], base[i], rng)); });
    if (picked.length < n) {
      const have = new Set(picked.map((p) => p.id));
      picked = picked.concat(sample(pool.filter((p) => !have.has(p.id)), n - picked.length, rng));
    }
    return shuffle(picked, rng);
  }

  // ---- inline markdown + KaTeX (local copies, see js/assessment.js) ----
  function mdInline(t) {
    if (t == null) return "";
    return String(t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/==(.+?)==/g, '<mark class="term-highlight">$1</mark>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }
  function typeset(el) {
    if (typeof window.renderMathInElement !== "function") return;
    try {
      window.renderMathInElement(el, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
      });
    } catch (_) { /* leave raw */ }
  }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function readData() {
    try { return JSON.parse(document.getElementById("ut-data").textContent); } catch (_) { return null; }
  }

  function priorAttempts(key) {
    try { return JSON.parse(localStorage.getItem(`pa:ut:${key}`) || "[]"); } catch (_) { return []; }
  }

  // ---- decide how many items ----
  function plan(data) {
    const T = data.blueprint.timing;
    const split = data.blueprint.pointSplit;
    const cfg = data.config || { mode: "time", minutes: 45 };
    const avgFrqPoints = data.frqPool.length
      ? data.frqPool.reduce((s, q) => s + q.totalPoints, 0) / data.frqPool.length
      : 6;
    const frqMinsEach = avgFrqPoints * T.frqMinutesPerPoint + T.frqMinutesOverhead;

    if (cfg.mode === "count") {
      return { mcq: cfg.mcq || 0, frq: cfg.frq || 0, minutes: cfg.minutes || data.blueprint.unitTest.timeLimitMinutes };
    }
    // time mode: target the 50/50 point split, then trim to fit the minute budget.
    const minutes = cfg.minutes || data.blueprint.unitTest.timeLimitMinutes;
    // total points P: MCQ carries split.mcq*P points (that many 1-pt MCQs), FRQ carries split.frq*P.
    // time = split.mcq*P*mcqMin + (split.frq*P/avgPts)*frqMinsEach = minutes
    const perPoint = split.mcq * T.mcqMinutes + (split.frq / avgFrqPoints) * frqMinsEach;
    const P = minutes / perPoint;
    let mcq = Math.min(Math.round(split.mcq * P), data.mcqPool.length);
    if (!data.mcqPool.length) mcq = 0;
    // fill whatever time is left with whole FRQs (floor, so the test stays under budget)
    const frqBudget = minutes - mcq * T.mcqMinutes;
    let frq = data.frqPool.length ? Math.max(1, Math.floor(frqBudget / frqMinsEach)) : 0;
    frq = Math.min(frq, data.frqPool.length);
    return { mcq, frq, minutes };
  }

  // ---- build the test instance ----
  function buildInstance(data, rng) {
    const { mcq, frq, minutes } = plan(data);
    const dist = data.blueprint.difficultyDistribution;
    const mcqs = stratified(data.mcqPool, mcq, dist, rng).map((q) => {
      const order = shuffle(q.choices.map((_, i) => i), rng);
      return {
        kind: "mcq", id: q.id,
        question: q.question,
        choices: order.map((i) => q.choices[i]),
        correct: order.indexOf(q.correctAnswer),
        origOrder: order,
        feedback: q.feedback, difficulty: q.difficulty, cognitiveLevel: q.cognitiveLevel,
        figureHtml: q.figureHtml,
      };
    });
    const frqs = stratified(data.frqPool, frq, dist, rng).map((q) => ({ kind: "frq", ...q }));
    return { minutes, items: shuffle(mcqs, rng).concat(shuffle(frqs, rng)), mcqCount: mcqs.length, frqCount: frqs.length };
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  }
  function band(pct, bp) {
    if (pct >= bp.targetMarkPercent) return { label: "At target", cls: "is-target" };
    if (pct >= bp.passMarkPercent) return { label: "Passing — keep pushing to target", cls: "is-pass" };
    return { label: "Below the pass mark", cls: "is-fail" };
  }

  function init() {
    const data = readData();
    const root = document.getElementById("ut-root");
    if (!data || !root) return;
    const bp = data.blueprint.unitTest;

    // fresh seed every load -> different test every attempt
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    const inst = buildInstance(data, makeRng(seed));

    if (!inst.items.length) {
      root.innerHTML = `<p class="ut-empty">This unit's question bank is not populated yet — no test can be generated.</p>`;
      return;
    }

    renderCover();

    function renderCover() {
      root.innerHTML = "";
      const c = el("div", "ut-cover card");
      const prior = priorAttempts(data.key);
      const best = prior.length ? Math.max.apply(null, prior.map((a) => a.pct)) : null;
      c.innerHTML = `
        <h2>${data.title}</h2>
        <ul class="ut-cover__facts">
          <li><span>Time limit</span><strong>${inst.minutes} minutes</strong></li>
          <li><span>Questions</span><strong>${inst.mcqCount} multiple-choice${inst.frqCount ? ` &middot; ${inst.frqCount} free-response` : ""}</strong></li>
          <li><span>Calculator</span><strong>${data.calculatorPolicy === "not-allowed" ? "Not permitted" : "Permitted"}</strong></li>
          <li><span>Pass / target</span><strong>${bp.passMarkPercent}% / ${bp.targetMarkPercent}%</strong></li>
          ${best != null ? `<li><span>Your best (${prior.length} attempt${prior.length === 1 ? "" : "s"})</span><strong>${best}%</strong></li>` : ""}
        </ul>
        <p class="ut-cover__note">This test is <strong>generated fresh every time</strong> — a new set of questions in a new order, drawn from the whole unit. Multiple-choice is scored automatically; you grade your own free-response against the model answer and rubric. The timer starts when you press begin and <strong>submits automatically at 0:00</strong>.</p>
        ${data.calculatorPolicy === "not-allowed" ? `<p class="ut-cover__note ut-cover__note--warn">No calculator. Every question here can be done by hand.</p>` : ""}
        <button type="button" class="ut-begin">Begin the test</button>
      `;
      c.querySelector(".ut-begin").addEventListener("click", startTest);
      root.appendChild(c);
      typeset(c);
    }

    function startTest() {
      root.innerHTML = "";
      const bar = el("div", "ut-bar");
      bar.innerHTML = `<span class="ut-bar__timer" id="ut-timer">${fmtTime(inst.minutes * 60)}</span>
        <span class="ut-bar__prog" id="ut-prog"></span>
        <button type="button" class="ut-bar__submit" id="ut-submit">Submit test</button>`;
      root.appendChild(bar);

      const form = el("form", "ut-form");
      form.setAttribute("novalidate", "");
      root.appendChild(form);

      const answers = {};   // id -> chosen index (mcq)
      const selfScores = {}; // id -> earned points (frq, after submit)

      inst.items.forEach((it, qi) => {
        const q = el("section", `ut-q ut-q--${it.kind}`);
        q.id = `ut-q-${qi}`;
        const head = el("div", "ut-q__head",
          `<span class="ut-q__n">${it.kind === "mcq" ? "Q" : "FR"}${qi + 1}</span>`);
        q.appendChild(head);

        if (it.kind === "mcq") {
          q.appendChild(el("div", "ut-q__stem", mdInline(it.question)));
          if (it.figureHtml) q.appendChild(el("div", "ut-q__fig", it.figureHtml));
          const opts = el("div", "ut-q__opts");
          it.choices.forEach((ch, ci) => {
            const lab = el("label", "ut-opt");
            const inp = el("input");
            inp.type = "radio"; inp.name = `q${qi}`; inp.value = String(ci);
            inp.addEventListener("change", () => { answers[it.id] = ci; updateProg(); });
            lab.appendChild(inp);
            lab.appendChild(el("span", "ut-opt__txt", mdInline(ch)));
            opts.appendChild(lab);
          });
          q.appendChild(opts);
        } else {
          if (it.scenarioHtml) q.appendChild(el("div", "ut-q__stem", it.scenarioHtml));
          else q.appendChild(el("div", "ut-q__stem", mdInline(it.scenario)));
          if (it.figureHtml) q.appendChild(el("div", "ut-q__fig", it.figureHtml));
          const parts = el("ol", "ut-q__parts");
          (it.parts || []).forEach((p) => {
            parts.appendChild(el("li", "ut-q__part",
              `${mdInline(p.prompt)} <span class="ut-q__pts">(${p.points} pt${p.points === 1 ? "" : "s"})</span>`));
          });
          q.appendChild(parts);
          q.appendChild(el("p", "ut-q__frqnote", "Work this on paper. After you submit you'll see the model answer and grade yourself."));
        }
        form.appendChild(q);
      });
      typeset(form);

      function updateProg() {
        const done = inst.items.filter((it) => it.kind === "mcq" && answers[it.id] != null).length;
        document.getElementById("ut-prog").textContent = `${done} / ${inst.mcqCount} MCQ answered`;
      }
      updateProg();

      // ---- timer ----
      let remaining = inst.minutes * 60;
      const startedAt = Date.now();
      const timerEl = document.getElementById("ut-timer");
      const tick = setInterval(() => {
        remaining -= 1;
        timerEl.textContent = fmtTime(Math.max(0, remaining));
        if (remaining <= 300) timerEl.classList.add("is-low");
        if (remaining <= 0) { clearInterval(tick); doSubmit(true); }
      }, 1000);

      document.getElementById("ut-submit").addEventListener("click", () => doSubmit(false));

      function doSubmit(auto) {
        clearInterval(tick);
        const durationSec = Math.round((Date.now() - startedAt) / 1000);
        form.querySelectorAll("input").forEach((i) => (i.disabled = true));
        document.getElementById("ut-submit").disabled = true;

        // MCQ scoring + inline review
        let mcqCorrect = 0;
        inst.items.forEach((it, qi) => {
          if (it.kind !== "mcq") return;
          const chosen = answers[it.id];
          const right = chosen === it.correct;
          if (right) mcqCorrect += 1;
          const qEl = document.getElementById(`ut-q-${qi}`);
          qEl.classList.add(right ? "is-right" : chosen == null ? "is-blank" : "is-wrong");
          const opts = qEl.querySelectorAll(".ut-opt");
          opts[it.correct] && opts[it.correct].classList.add("is-correct");
          if (chosen != null && !right) opts[chosen].classList.add("is-chosen");
          const fb = it.feedback;
          if (fb) {
            const txt = right
              ? (fb.correct || "Correct.")
              : (chosen != null && fb.incorrect && fb.incorrect[String(it.origOrder[chosen])]) || fb.correct || "";
            qEl.appendChild(el("div", "ut-q__fb", mdInline(
              (right ? "**Correct.** " : chosen == null ? "**Not answered.** " : "**Not quite.** ") + txt)));
          }
          typeset(qEl);
        });
        const mcqPct = inst.mcqCount ? Math.round((mcqCorrect / inst.mcqCount) * 100) : null;

        // FRQ: reveal model answers + self-grade inputs
        const frqTotal = inst.items.filter((it) => it.kind === "frq").reduce((s, it) => s + it.totalPoints, 0);
        inst.items.forEach((it, qi) => {
          if (it.kind !== "frq") return;
          const qEl = document.getElementById(`ut-q-${qi}`);
          const model = el("div", "ut-q__model");
          model.appendChild(el("div", "ut-q__model-h", "Model answer &amp; rubric"));
          (it.parts || []).forEach((p) => {
            model.appendChild(el("div", "ut-q__model-p",
              `<strong>${p.label} (${p.points} pt${p.points === 1 ? "" : "s"}).</strong> ${mdInline(p.modelResponse || "")}`));
          });
          if (it.scoringNotes) model.appendChild(el("div", "ut-q__model-notes", mdInline("**Scoring:** " + it.scoringNotes)));
          const grade = el("label", "ut-q__grade");
          grade.innerHTML = `Points you earned on FR${qi + 1}: `;
          const gi = el("input");
          gi.type = "number"; gi.min = "0"; gi.max = String(it.totalPoints); gi.step = "0.5"; gi.value = "0";
          gi.addEventListener("input", () => {
            selfScores[it.id] = Math.max(0, Math.min(it.totalPoints, Number(gi.value) || 0));
            renderResult();
          });
          selfScores[it.id] = 0;
          grade.appendChild(gi);
          grade.appendChild(el("span", "ut-q__grade-max", ` / ${it.totalPoints}`));
          model.appendChild(grade);
          qEl.appendChild(model);
          typeset(qEl);
        });

        document.getElementById("ut-prog").textContent = auto ? "Time — auto-submitted" : "Submitted";
        timerEl.classList.add("is-done");

        const panel = el("div", "ut-result card");
        root.insertBefore(panel, form);
        let attemptNo = null; // 1-based index into pa:ut:<key>; set on first render, updated after

        function renderResult() {
          const frqEarned = inst.items.filter((it) => it.kind === "frq")
            .reduce((s, it) => s + (selfScores[it.id] || 0), 0);
          // composite: weight the two sections to the blueprint point split
          const split = data.blueprint.pointSplit;
          let compositePct;
          if (mcqPct != null && frqTotal > 0) {
            const frqPct = Math.round((frqEarned / frqTotal) * 100);
            compositePct = Math.round(split.mcq * mcqPct + split.frq * frqPct);
          } else if (mcqPct != null) {
            compositePct = mcqPct;
          } else {
            compositePct = Math.round((frqEarned / (frqTotal || 1)) * 100);
          }
          const b = band(compositePct, bp);
          const frqPct = frqTotal ? Math.round((frqEarned / frqTotal) * 100) : null;
          panel.className = `ut-result card ${b.cls}`;
          panel.innerHTML = `
            <p class="ut-result__score">${compositePct}%<span class="ut-result__band">${b.label}</span></p>
            <ul class="ut-result__lines">
              ${mcqPct != null ? `<li>Multiple choice: <strong>${mcqCorrect} / ${inst.mcqCount}</strong> (${mcqPct}%)</li>` : ""}
              ${frqPct != null ? `<li>Free response (self-graded): <strong>${frqEarned} / ${frqTotal}</strong> (${frqPct}%)</li>` : ""}
              <li>Time used: <strong>${fmtTime(durationSec)}</strong> of ${inst.minutes}:00</li>
            </ul>
            <p class="ut-result__hint">Scroll down: every question is marked, with why each option is right or wrong. Reload for a brand-new test.</p>`;
          const rec = { pct: compositePct, mcqPct: mcqPct, frqPct: frqPct, durationSec, at: Date.now(), seed };
          try {
            const k = `pa:ut:${data.key}`;
            const list = JSON.parse(localStorage.getItem(k) || "[]");
            if (attemptNo == null) { list.push(rec); attemptNo = list.length; }
            else { list[attemptNo - 1] = rec; }        // student adjusted a self-score
            localStorage.setItem(k, JSON.stringify(list));
          } catch (_) { /* storage unavailable */ }
        }
        renderResult();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
