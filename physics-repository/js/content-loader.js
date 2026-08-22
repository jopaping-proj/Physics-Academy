/**
 * Reads the lesson JSON the build script embedded in the page (see
 * build/build.js) and exposes it to every other module. On a page the
 * build script generated, a <script type="application/json" id="lesson-data">
 * tag holds the full lesson object — no runtime fetch needed, which keeps
 * the page usable the instant HTML parses (matters for §29 performance
 * on slow school Wi-Fi).
 *
 * Falls back to fetch() only for local development against unbuilt
 * content, or for question-bank files loaded on demand (e.g. Further
 * Practice pulling extra questions not embedded in the page).
 */

let cachedLessonData = null;

export function getLessonData() {
  if (cachedLessonData) return cachedLessonData;

  const script = document.getElementById("lesson-data");
  if (!script) {
    console.warn(
      "[content-loader] No embedded #lesson-data script found on this page."
    );
    return null;
  }

  try {
    cachedLessonData = JSON.parse(script.textContent);
    return cachedLessonData;
  } catch (err) {
    console.error("[content-loader] Failed to parse embedded lesson data:", err);
    return null;
  }
}

/**
 * Fetches a question-bank file by unit id, e.g. "ap-physics-1/unit-2".
 * Used for Further Practice and future retrieval/review features that
 * need questions beyond what's embedded in the current lesson.
 * @param {string} unitPath
 * @returns {Promise<Array>}
 */
export async function fetchQuestionBank(unitPath) {
  const res = await fetch(`/data/question-bank/${unitPath}.json`);
  if (!res.ok) {
    throw new Error(`[content-loader] Could not load question bank: ${unitPath}`);
  }
  return res.json();
}
