/**
 * Shared chrome around every simulation (master-project-prompt.md §14):
 * Play, Pause, Step, and Reset controls, plus an optional
 * prediction-prompt gate that follows the Predict → Commit → Manipulate
 * → Observe → Explain → Generalize flow from rigor-standard-addendum.md
 * §10 — every control except Reset stays disabled until the student
 * commits to a prediction.
 *
 * Individual simulations (in simulations/*) own their own Canvas/p5.js
 * drawing logic and physics loop; they call into this module only for
 * these standard controls, rather than reimplementing play/pause/
 * step/reset/prediction-gating each time.
 *
 * Plain script, not an ES module — see js/content-loader.js for why.
 * Wrapped in an IIFE so its internals don't leak into the shared
 * top-level scope every plain <script> on the page shares.
 */
window.PA = window.PA || {};

(function () {
/**
 * @param {HTMLElement} container - the .interactive-panel element
 * @param {{
 *   onPlay: () => void,
 *   onPause: () => void,
 *   onReset: () => void,
 *   onStep?: () => void,               // omit to hide the Step button entirely
 *   predictionPrompt?: { question: string, choices: string[] }
 * }} config
 */
function initSimulationChrome(container, config) {
  const toolbar = document.createElement("div");
  toolbar.className = "interactive-panel__toolbar";

  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.textContent = "Play";

  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.textContent = "Pause";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "Reset";

  const gatedButtons = [playBtn, pauseBtn];

  playBtn.addEventListener("click", () => config.onPlay?.());
  pauseBtn.addEventListener("click", () => config.onPause?.());
  resetBtn.addEventListener("click", () => config.onReset?.());

  toolbar.appendChild(playBtn);
  toolbar.appendChild(pauseBtn);

  if (config.onStep) {
    const stepBtn = document.createElement("button");
    stepBtn.type = "button";
    stepBtn.textContent = "Step (0.1s)";
    stepBtn.addEventListener("click", () => config.onStep?.());
    toolbar.appendChild(stepBtn);
    gatedButtons.push(stepBtn);
  }

  toolbar.appendChild(resetBtn);
  container.appendChild(toolbar);

  if (config.predictionPrompt) {
    gatedButtons.forEach((b) => (b.disabled = true));
    renderPredictionGate(container, config.predictionPrompt, () => {
      gatedButtons.forEach((b) => (b.disabled = false));
    });
  }

  return { playBtn, pauseBtn, resetBtn };
}

function renderPredictionGate(container, prompt, onCommitted) {
  const gate = document.createElement("div");
  gate.className = "card";
  gate.innerHTML = `<p><strong>Predict before you run this:</strong> ${prompt.question}</p>`;

  prompt.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__choice";
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      gate.remove();
      onCommitted();
    });
    gate.appendChild(btn);
  });

  container.prepend(gate);
}

window.PA.simulations = { initSimulationChrome };
})();
