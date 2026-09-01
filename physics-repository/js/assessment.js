/**
 * FormativeCheck / quiz rendering and scoring, against the question-bank
 * schema in master-project-prompt.md §27. Handles multiple-choice fully;
 * other question types (numerical, short-response, ranking, etc.) render
 * their prompt and solution but leave scoring to a human/self-check,
 * since auto-grading free text is out of scope for this phase.
 *
 * Per §8: never just show "Correct"/"Incorrect" — always surface the
 * reasoning, including the misconception behind each wrong choice.
 *
 * Wiring model: build.js emits an empty `<div class="quiz-mount">`
 * containing a `<script type="application/json" class="quiz-question-data">`
 * with the question's JSON. initAllFormativeChecks() (auto-run on
 * DOMContentLoaded) finds every mount on the page and renders it here.
 * This keeps the build script a pure data-to-markup step and keeps all
 * interactivity — and all markdown emphasis rendering — in one place.
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * `mdInline` and `renderDifficultyBadge` below are small local copies
 * of the canonical versions in js/markdown.js and js/difficulty.js
 * (which stay ES modules — they're also imported by the Node build
 * script, where there's no file:// restriction to work around). Keep
 * these in sync if either canonical version changes.
 *
 * Wrapped in an IIFE so its internals don't leak into the shared
 * top-level scope every plain <script> on the page shares.
 */
window.PA = window.PA || {};

(function () {
function mdInline(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/==(.+?)==/g, '<mark class="term-highlight">$1</mark>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="key-term">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const DIFFICULTY_LABELS = {
  "foundation": "Foundation",
  "developing": "Developing",
  "ap-ib-standard": "AP/IB Standard",
  "ap5-ib7-target": "AP 5 / IB 7 Target",
  "distinction-stretch": "Distinction / Stretch",
};

function renderDifficultyBadge(difficulty) {
  const el = document.createElement("span");
  el.className = "difficulty-badge";
  el.dataset.difficulty = difficulty;
  el.textContent = DIFFICULTY_LABELS[difficulty] || difficulty;
  return el;
}

/**
 * Re-run KaTeX over a subtree that was inserted after the page's initial
 * auto-render pass (quiz questions, choices, and feedback all carry
 * $...$ math and are built from JSON at runtime). No-op if KaTeX hasn't
 * loaded yet or isn't present.
 */
function typesetMath(el) {
  if (!el || typeof window.renderMathInElement !== "function") return;
  try {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
    });
  } catch (_) {
    /* malformed LaTeX in authored content — leave the raw text visible */
  }
}

/**
 * Answered formative checks are remembered per lesson (localStorage) so
 * a student who reloads or comes back later sees their previous answer
 * and its feedback, not a blank quiz — consistent with formative checks
 * being one-shot (no retry-until-correct). Keyed by pathname; values are
 * `{ questionId: chosenIndex }`, plus `__hook` for the hook prediction.
 */
const ANSWERS_KEY = `pa:answers:${location.pathname}`;
function loadAnswers() {
  try {
    return JSON.parse(localStorage.getItem(ANSWERS_KEY) || "{}");
  } catch (_) {
    return {};
  }
}
function saveAnswer(id, value) {
  if (!id) return;
  try {
    const a = loadAnswers();
    a[id] = value;
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(a));
  } catch (_) {
    /* private mode / file:// — non-fatal, the quiz just won't persist */
  }
}

/**
 * Finds every `.quiz-mount` on the page (or within `root`) and renders
 * its embedded question data as an interactive formative check.
 * @param {ParentNode} root
 */
function initAllFormativeChecks(root = document) {
  const mounts = root.querySelectorAll(".quiz-mount");
  mounts.forEach((mount) => {
    const dataScript = mount.querySelector(".quiz-question-data");
    if (!dataScript) return;
    let question;
    try {
      question = JSON.parse(dataScript.textContent);
    } catch (err) {
      console.error("[assessment] Failed to parse quiz question data:", err);
      return;
    }
    mountFormativeCheck(mount, question);
  });
}

/**
 * Renders a full formative check into `container`: difficulty badge,
 * question, choices (multiple-choice) or solution-only display (other
 * types), then hint/solution progressive disclosure if authored.
 * @param {HTMLElement} container - the `.quiz-mount` element
 * @param {object} question
 */
function mountFormativeCheck(container, question) {
  container.innerHTML = "";

  if (question.difficulty) {
    container.appendChild(renderDifficultyBadge(question.difficulty));
  }

  if (question.type === "multiple-choice" && Array.isArray(question.choices)) {
    renderMultipleChoice(container, question);
  } else if (question.type === "free-response" || Array.isArray(question.parts)) {
    renderFreeResponse(container, question);
  } else {
    const prompt = document.createElement("p");
    prompt.innerHTML = mdInline(question.question || "");
    container.appendChild(prompt);
  }

  if (question.hint || question.solution) {
    renderProgressiveDisclosure(container, question);
  }

  typesetMath(container);
}

/**
 * Renders a free-response question: the scenario, each part with its
 * point value and a progressive-disclosure "Model response", the point
 * total, and optional scoring notes. FRQs are self-check — the student
 * works them on paper and grades against the model answer — so there is
 * no submit, and the deck treats the card as content (js/lesson-slides.js).
 */
function renderFreeResponse(container, question) {
  container.classList.add("frq");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Free-response question");

  const note = document.createElement("p");
  note.className = "frq__note";
  note.innerHTML =
    "<strong>Free response.</strong> Work every part on paper, then open each model response and grade yourself against it.";
  container.appendChild(note);

  const scenario = document.createElement("p");
  scenario.className = "frq__scenario";
  scenario.innerHTML = mdInline(question.scenario || question.question || "");
  container.appendChild(scenario);

  const parts = Array.isArray(question.parts) ? question.parts : [];
  if (parts.length) {
    const list = document.createElement("ol");
    list.className = "frq__parts";
    parts.forEach((part) => {
      const li = document.createElement("li");
      const prompt = document.createElement("p");
      prompt.className = "frq__prompt";
      const pts =
        part.points != null
          ? ` <span class="frq__points">(${part.points} pt${part.points === 1 ? "" : "s"})</span>`
          : "";
      prompt.innerHTML = mdInline(part.prompt || "") + pts;
      li.appendChild(prompt);

      if (part.modelResponse) {
        const d = document.createElement("details");
        d.className = "disclosure";
        const s = document.createElement("summary");
        s.textContent = "Model response";
        d.appendChild(s);
        const body = document.createElement("div");
        body.innerHTML = mdInline(part.modelResponse);
        d.appendChild(body);
        li.appendChild(d);
      }
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  if (question.totalPoints != null) {
    const total = document.createElement("p");
    total.className = "frq__total";
    total.textContent = `Total: ${question.totalPoints} points`;
    container.appendChild(total);
  }

  if (question.scoringNotes) {
    const d = document.createElement("details");
    d.className = "disclosure";
    const s = document.createElement("summary");
    s.textContent = "Scoring notes";
    d.appendChild(s);
    const body = document.createElement("p");
    body.innerHTML = mdInline(question.scoringNotes);
    d.appendChild(body);
    container.appendChild(d);
  }
}

/**
 * @param {HTMLElement} container - element to render the quiz into
 * @param {object} question - one item from the question-bank schema
 */
function renderMultipleChoice(container, question) {
  container.classList.add("quiz");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Formative check question");

  const prompt = document.createElement("p");
  prompt.innerHTML = mdInline(question.question);
  container.appendChild(prompt);

  const list = document.createElement("div");
  question.choices.forEach((choiceText, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__choice";
    btn.innerHTML = mdInline(choiceText);
    btn.dataset.index = String(index);
    btn.addEventListener("click", () => handleAnswer(container, question, index, list));
    list.appendChild(btn);
  });
  container.appendChild(list);

  const feedback = document.createElement("div");
  feedback.className = "quiz__feedback";
  feedback.hidden = true;
  container.appendChild(feedback);

  // Replay a previously saved answer (reload / return visit).
  const saved = loadAnswers()[question.id];
  if (Number.isInteger(saved) && saved >= 0 && saved < question.choices.length) {
    handleAnswer(container, question, saved, list, { restore: true });
  }
}

function handleAnswer(container, question, chosenIndex, choiceList, { restore = false } = {}) {
  const feedback = container.querySelector(".quiz__feedback");
  const buttons = Array.from(choiceList.querySelectorAll(".quiz__choice"));

  // Lock in the answer — a formative check should not let a student
  // retry-until-correct without engaging with why the first pick was wrong.
  buttons.forEach((b) => (b.disabled = true));
  if (!restore) saveAnswer(question.id, chosenIndex);

  const isCorrect = chosenIndex === question.correctAnswer;
  buttons[chosenIndex].dataset.state = isCorrect ? "correct" : "incorrect";
  if (!isCorrect) {
    buttons[question.correctAnswer].dataset.state = "correct";
  }

  const explanation = isCorrect
    ? question.feedback?.correct
    : question.feedback?.incorrect?.[String(chosenIndex)];

  feedback.hidden = false;
  feedback.innerHTML = "";

  const verdict = document.createElement("strong");
  verdict.textContent = isCorrect ? "Correct — but read why:" : "Not quite — here's the reasoning:";
  feedback.appendChild(verdict);

  const explanationEl = document.createElement("p");
  explanationEl.innerHTML = mdInline(
    explanation || "(No feedback authored for this choice yet — flag for content review.)"
  );
  feedback.appendChild(explanationEl);
  typesetMath(feedback);

  container.dispatchEvent(
    new CustomEvent("formative-check:answered", {
      bubbles: true,
      detail: { questionId: question.id, chosenIndex, isCorrect, restored: restore },
    })
  );
}

/**
 * Renders the Question → Hint 1 → Hint 2 → Solution → Explanation
 * progressive-disclosure structure from §9, using native <details> so it
 * stays keyboard- and screen-reader-accessible for free (§23) without
 * custom JS state management.
 * @param {HTMLElement} container
 * @param {object} question
 */
function renderProgressiveDisclosure(container, question) {
  const hints = Array.isArray(question.hint) ? question.hint : [question.hint].filter(Boolean);

  hints.forEach((hintText, i) => {
    const details = document.createElement("details");
    details.className = "disclosure";
    const summary = document.createElement("summary");
    summary.textContent = `Hint ${i + 1}`;
    details.appendChild(summary);
    const body = document.createElement("p");
    body.innerHTML = mdInline(hintText);
    details.appendChild(body);
    container.appendChild(details);
  });

  if (question.solution) {
    const details = document.createElement("details");
    details.className = "disclosure";
    const summary = document.createElement("summary");
    summary.textContent = "Solution";
    details.appendChild(summary);
    const body = document.createElement("p");
    body.innerHTML = mdInline(question.solution);
    details.appendChild(body);
    container.appendChild(details);
  }
}

/**
 * Wires up the hook (rendered statically by build.js, not as a
 * quiz-mount — a hook is "predict now, understand why later," so it
 * shows the correct answer without an explanation, unlike a regular
 * formative check). Select → Submit → locked, correct choice
 * highlighted (and the student's choice marked wrong if it was), no
 * feedback text. See §5 of the master project prompt.
 */
function initHookPredictions(root = document) {
  const hookCard = root.querySelector(".hook-card");
  const hookQuiz = hookCard?.querySelector(".hook-card__quiz");
  const submitBtn = hookCard?.querySelector(".hook-card__submit");
  if (!hookQuiz || !submitBtn) return;

  const correctIndex = Number(hookQuiz.dataset.correctIndex);
  const buttons = Array.from(hookQuiz.querySelectorAll(".quiz__choice"));
  let selectedIndex = null;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedIndex = Number(btn.dataset.index);
      buttons.forEach((b) => delete b.dataset.state);
      btn.dataset.state = "selected";
      submitBtn.disabled = false;
    });
  });

  function lockIn() {
    buttons.forEach((b) => (b.disabled = true));
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitted";
    buttons.forEach((b, i) => {
      if (i === correctIndex) b.dataset.state = "correct";
      else if (i === selectedIndex) b.dataset.state = "incorrect";
      else delete b.dataset.state;
    });
    hookCard.dispatchEvent(new CustomEvent("formative-check:answered", { bubbles: true }));
  }

  submitBtn.addEventListener("click", () => {
    if (selectedIndex === null) return;
    saveAnswer("__hook", selectedIndex);
    lockIn();
  });

  const savedHook = loadAnswers().__hook;
  if (Number.isInteger(savedHook) && savedHook >= 0 && savedHook < buttons.length) {
    selectedIndex = savedHook;
    lockIn();
  }
}

/**
 * Wires up every Error Analysis text response: a character-limited
 * textarea plus a Submit button that locks the textarea and reveals
 * the model response only once the student has committed their own
 * answer — the model response is never visible beforehand.
 */
function initErrorAnalysis(root = document) {
  root.querySelectorAll(".error-analysis__response").forEach((wrap) => {
    const textarea = wrap.querySelector(".error-analysis__textarea");
    const counter = wrap.querySelector(".error-analysis__counter");
    const submitBtn = wrap.querySelector(".error-analysis__submit");
    const modelResponse = wrap.querySelector(".error-analysis__model-response");
    if (!textarea || !counter || !submitBtn || !modelResponse) return;

    const maxLength = Number(wrap.dataset.maxLength) || textarea.maxLength || 600;
    const key = textarea.id || null;

    const updateCounter = () => {
      counter.textContent = `${textarea.value.length} / ${maxLength}`;
      submitBtn.disabled = textarea.value.trim().length === 0;
    };
    textarea.addEventListener("input", updateCounter);

    const lockIn = () => {
      textarea.disabled = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitted";
      modelResponse.hidden = false;
      wrap.dispatchEvent(new CustomEvent("formative-check:answered", { bubbles: true }));
    };

    submitBtn.addEventListener("click", () => {
      if (key) saveAnswer(key, textarea.value);
      lockIn();
    });

    // restore a previously submitted response
    const saved = key ? loadAnswers()[key] : undefined;
    if (typeof saved === "string") {
      textarea.value = saved;
      lockIn();
    }
    updateCounter();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAllFormativeChecks();
  initHookPredictions();
  initErrorAnalysis();
});

window.PA.assessment = { initAllFormativeChecks, mountFormativeCheck, renderMultipleChoice, renderProgressiveDisclosure };
})();
