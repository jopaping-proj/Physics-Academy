/**
 * Concept-inventory delivery (docs/ap-physics-1-unit-2-architecture.md §10).
 *
 * A per-unit, pre-instruction check of the student's force-and-motion
 * intuitions, retaken at the end of the unit.
 *
 *   - Questions AND answer choices are shuffled on every load (so the
 *     end-of-unit retake can't be gamed by memorised positions).
 *   - NO per-question feedback, ever — no "correct/incorrect", no review.
 *   - On submit the student is told ONLY their score and percentage,
 *     plus the reminder that item analysis is not provided and that they
 *     take the same check again at the end of the unit.
 *   - Each attempt's {score, total, pct, at} is kept in localStorage
 *     (pa:ci:<diagnosticKey>) so the first vs. later attempts can be
 *     compared internally later; the gain is NOT shown to the student.
 *
 * Plain script (see js/content-loader.js). Canvas-free; KaTeX renders
 * the stems/choices.
 */
(function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function readData() {
    const el = document.getElementById("ci-data");
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (_) {
      return null;
    }
  }

  function typeset(el) {
    if (typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      } catch (_) {
        /* leave raw */
      }
    }
  }

  function recordAttempt(key, score, total) {
    if (!key) return;
    try {
      const k = `pa:ci:${key}`;
      const prev = JSON.parse(localStorage.getItem(k) || "[]");
      prev.push({ score, total, pct: Math.round((score / total) * 100), at: Date.now() });
      localStorage.setItem(k, JSON.stringify(prev));
      return prev.length; // attempt number
    } catch (_) {
      return null;
    }
  }

  function init() {
    const data = readData();
    const list = document.getElementById("ci-items");
    const form = document.getElementById("ci-form");
    const result = document.getElementById("ci-result");
    const progress = document.getElementById("ci-progress");
    if (!data || !Array.isArray(data.items) || !list || !form) return;

    // shuffle items; shuffle each item's choices, tracking the new correct index
    const items = shuffle(data.items).map((item) => {
      const order = shuffle(item.choices.map((_, i) => i));
      return {
        id: item.id,
        stem: item.stem,
        choices: order.map((i) => item.choices[i]),
        correct: order.indexOf(item.correct),
      };
    });

    const total = items.length;
    const answers = new Array(total).fill(null);

    items.forEach((item, qi) => {
      const li = document.createElement("li");
      li.className = "ci-item";
      const fs = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.className = "ci-stem";
      legend.innerHTML = item.stem;
      fs.appendChild(legend);

      item.choices.forEach((choice, ci) => {
        const id = `q${qi}-c${ci}`;
        const label = document.createElement("label");
        label.className = "ci-choice";
        label.setAttribute("for", id);
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${qi}`;
        input.id = id;
        input.value = String(ci);
        input.addEventListener("change", () => {
          answers[qi] = ci;
          updateProgress();
        });
        const span = document.createElement("span");
        span.innerHTML = choice;
        label.append(input, span);
        fs.appendChild(label);
      });

      li.appendChild(fs);
      list.appendChild(li);
    });

    typeset(list);

    function updateProgress() {
      const done = answers.filter((a) => a !== null).length;
      progress.textContent = `${done} of ${total} answered`;
    }
    updateProgress();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const unanswered = answers.reduce((n, a) => n + (a === null ? 1 : 0), 0);
      if (unanswered > 0) {
        progress.textContent = `Please answer all ${total} questions — ${unanswered} left.`;
        const firstBlank = answers.findIndex((a) => a === null);
        list.children[firstBlank]?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      let score = 0;
      items.forEach((item, qi) => {
        if (answers[qi] === item.correct) score += 1;
      });
      const pct = Math.round((score / total) * 100);
      const attempt = recordAttempt(data.diagnosticKey, score, total);

      // lock the form
      form.querySelectorAll("input").forEach((i) => (i.disabled = true));
      form.querySelector(".ci-submit").disabled = true;

      result.hidden = false;
      result.innerHTML = `
        <p class="ci-score">You answered <strong>${score} of ${total}</strong> correctly &mdash; <strong>${pct}%</strong>.</p>
        <p>${
          attempt && attempt > 1
            ? "This was the end-of-unit check."
            : "Keep going into the unit."
        } <strong>No item analysis is provided</strong> — you are not told which questions you missed or why.
        ${
          attempt && attempt <= 1
            ? "You will take this same check again at the end of the unit to see how your thinking changed."
            : ""
        }</p>`;
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
