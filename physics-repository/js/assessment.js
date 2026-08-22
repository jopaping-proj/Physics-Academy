/**
 * FormativeCheck / quiz rendering and scoring, against the question-bank
 * schema in master-project-prompt.md §27. Handles multiple-choice fully;
 * other question types (numerical, short-response, ranking, etc.) render
 * their prompt and solution but leave scoring to a human/self-check,
 * since auto-grading free text is out of scope for this phase.
 *
 * Per §8: never just show "Correct"/"Incorrect" — always surface the
 * reasoning, including the misconception behind each wrong choice.
 */

/**
 * @param {HTMLElement} container - element to render the quiz into
 * @param {object} question - one item from the question-bank schema
 */
export function renderMultipleChoice(container, question) {
  container.classList.add("quiz");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Formative check question");

  const prompt = document.createElement("p");
  prompt.textContent = question.question;
  container.appendChild(prompt);

  const list = document.createElement("div");
  question.choices.forEach((choiceText, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__choice";
    btn.textContent = choiceText;
    btn.dataset.index = String(index);
    btn.addEventListener("click", () => handleAnswer(container, question, index, list));
    list.appendChild(btn);
  });
  container.appendChild(list);

  const feedback = document.createElement("div");
  feedback.className = "quiz__feedback";
  feedback.hidden = true;
  container.appendChild(feedback);
}

function handleAnswer(container, question, chosenIndex, choiceList) {
  const feedback = container.querySelector(".quiz__feedback");
  const buttons = Array.from(choiceList.querySelectorAll(".quiz__choice"));

  // Lock in the answer — a formative check should not let a student
  // retry-until-correct without engaging with why the first pick was wrong.
  buttons.forEach((b) => (b.disabled = true));

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
  explanationEl.textContent =
    explanation || "(No feedback authored for this choice yet — flag for content review.)";
  feedback.appendChild(explanationEl);

  container.dispatchEvent(
    new CustomEvent("formative-check:answered", {
      bubbles: true,
      detail: { questionId: question.id, chosenIndex, isCorrect },
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
export function renderProgressiveDisclosure(container, question) {
  const hints = Array.isArray(question.hint) ? question.hint : [question.hint].filter(Boolean);

  hints.forEach((hintText, i) => {
    const details = document.createElement("details");
    details.className = "disclosure";
    const summary = document.createElement("summary");
    summary.textContent = `Hint ${i + 1}`;
    details.appendChild(summary);
    const body = document.createElement("p");
    body.textContent = hintText;
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
    body.textContent = question.solution;
    details.appendChild(body);
    container.appendChild(details);
  }
}
