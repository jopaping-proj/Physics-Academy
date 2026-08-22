/**
 * Shared chrome around every simulation (master-project-prompt.md §14):
 * pause/play, reset, and an optional prediction-prompt gate that follows
 * the Predict → Commit → Manipulate → Observe → Explain → Generalize
 * flow from rigor-standard-addendum.md §10.
 *
 * Individual simulations (in simulations/*) own their own p5.js/Canvas
 * drawing logic and call into this module for the standard controls
 * rather than reimplementing pause/reset/prediction-gating each time.
 */

/**
 * @param {HTMLElement} container - the .interactive-panel element
 * @param {{
 *   onPlayPause: (playing: boolean) => void,
 *   onReset: () => void,
 *   predictionPrompt?: { question: string, choices: string[] }
 * }} config
 */
export function initSimulationChrome(container, config) {
  const toolbar = document.createElement("div");
  toolbar.className = "interactive-panel__toolbar";

  let playing = false;
  const playPauseBtn = document.createElement("button");
  playPauseBtn.type = "button";
  playPauseBtn.textContent = "Play";
  playPauseBtn.addEventListener("click", () => {
    playing = !playing;
    playPauseBtn.textContent = playing ? "Pause" : "Play";
    config.onPlayPause?.(playing);
  });

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    playing = false;
    playPauseBtn.textContent = "Play";
    config.onReset?.();
  });

  toolbar.appendChild(playPauseBtn);
  toolbar.appendChild(resetBtn);
  container.appendChild(toolbar);

  if (config.predictionPrompt) {
    renderPredictionGate(container, config.predictionPrompt, () => {
      playPauseBtn.disabled = false;
    });
    playPauseBtn.disabled = true;
  }
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
