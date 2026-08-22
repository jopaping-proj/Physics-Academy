/**
 * Canonical difficulty scale + cognitive-level helpers.
 * Single source of truth for these values lives in data/taxonomies.json,
 * which mirrors rigor-standard-addendum.md §21. This module just gives
 * the rest of the app a typed, ergonomic way to use that data.
 */

export const DIFFICULTY_VALUES = [
  "foundation",
  "developing",
  "ap-ib-standard",
  "ap5-ib7-target",
  "distinction-stretch",
];

export const DIFFICULTY_LABELS = {
  "foundation": "Foundation",
  "developing": "Developing",
  "ap-ib-standard": "AP/IB Standard",
  "ap5-ib7-target": "AP 5 / IB 7 Target",
  "distinction-stretch": "Distinction / Stretch",
};

// Maps the addendum §3 page-layout groups onto the canonical scale.
// Used by the "Further Practice" section to sort questions into the
// three tiers described in rigor-standard-addendum.md §3.
export const LESSON_THREE_TIER_MAP = {
  "foundation": ["foundation", "developing"],
  "examination-readiness": ["ap-ib-standard", "ap5-ib7-target"],
  "mastery-distinction": ["distinction-stretch"],
};

/**
 * @param {string} difficulty - one of DIFFICULTY_VALUES
 * @throws if the value isn't in the canonical set — fail loudly rather
 *   than silently rendering an unlabeled badge, since an invalid value
 *   almost always means a typo in authored content.
 */
export function validateDifficulty(difficulty) {
  if (!DIFFICULTY_VALUES.includes(difficulty)) {
    throw new Error(
      `Invalid difficulty "${difficulty}". Must be one of: ${DIFFICULTY_VALUES.join(", ")}`
    );
  }
  return difficulty;
}

/**
 * Renders a <span class="difficulty-badge"> element for a given
 * canonical difficulty value. Pure DOM, no framework.
 * @param {string} difficulty
 * @returns {HTMLSpanElement}
 */
export function renderDifficultyBadge(difficulty) {
  validateDifficulty(difficulty);
  const el = document.createElement("span");
  el.className = "difficulty-badge";
  el.dataset.difficulty = difficulty;
  el.textContent = DIFFICULTY_LABELS[difficulty];
  return el;
}

/**
 * Groups an array of question-bank items (each with a `.difficulty`
 * field) into the three Further Practice tiers.
 * @param {Array<{difficulty: string}>} questions
 * @returns {{ "foundation": Array, "examination-readiness": Array, "mastery-distinction": Array }}
 */
export function groupByLessonTier(questions) {
  const groups = { "foundation": [], "examination-readiness": [], "mastery-distinction": [] };
  for (const q of questions) {
    const tier = Object.entries(LESSON_THREE_TIER_MAP).find(([, values]) =>
      values.includes(q.difficulty)
    );
    if (tier) groups[tier[0]].push(q);
  }
  return groups;
}
